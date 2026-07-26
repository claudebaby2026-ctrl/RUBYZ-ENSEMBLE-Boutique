"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CART_EVENT,
  type CartItem,
  addToCart as addToCartStorage,
  clearCart as clearCartStorage,
  getCart as getCartStorage,
  getCartCount,
  getCartSubtotal,
  removeFromCart as removeFromCartStorage,
  updateQuantity as updateQuantityStorage,
} from "@/lib/cart";
import {
  type ApiCartItem,
  addCartItemApi,
  clearCartApi,
  getCartFromApi,
  mergeCartApi,
  removeCartItemApi,
  updateCartItemApi,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

function fromApi(items: ApiCartItem[]): CartItem[] {
  return items.map((i) => ({
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    image: i.image,
    price: i.price,
    mrp: i.mrp,
    size: i.size,
    stock: i.stock,
    quantity: i.quantity,
    category: i.category,
  }));
}

/**
 * Module-level (not per-hook-instance) guard. Several components call
 * useCart() at once — the header badge, the cart page, the checkout page,
 * etc — each getting its own hook instance. A per-instance ref here would
 * let two instances both see "not merged yet" and both call mergeCartApi()
 * with the same guest items before either finishes clearCartStorage(),
 * silently doubling every item's quantity in the account cart right after
 * login. Tracking it at module scope means whichever instance runs first
 * wins and every other instance skips it.
 */
let mergedForUserId: number | null = null;

/**
 * Reactive cart state. Signed-in customers are backed by the database
 * (tied to their user_id via /cart — see backend app/routers/cart.py);
 * signed-out visitors keep using the localStorage cart from lib/cart.ts
 * exactly as before. The moment someone logs in, whatever was in their
 * guest cart is merged into their account's DB cart (see mergeCartApi) so
 * nothing they added while browsing gets lost.
 */
export function useCart() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (user) {
      try {
        const apiItems = await getCartFromApi();
        setItems(fromApi(apiItems));
      } catch {
        setItems([]);
      }
    } else {
      setItems(getCartStorage());
    }
    setHydrated(true);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    const doMergeThenRefresh = async () => {
      if (user && mergedForUserId !== user.id) {
        mergedForUserId = user.id;
        const guestItems = getCartStorage();
        if (guestItems.length > 0) {
          try {
            await mergeCartApi(guestItems);
            clearCartStorage();
          } catch {
            // Leave the guest cart in localStorage if the merge failed —
            // better to retry next load than to silently lose it. Reset
            // the guard too, so the retry isn't skipped as "already done".
            mergedForUserId = null;
          }
        }
      }
      refresh();
    };

    doMergeThenRefresh();
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("rubyz-auth-changed", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("rubyz-auth-changed", refresh);
    };
  }, [authLoading, user, refresh]);

  const addToCart = useCallback(
    async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      if (user) {
        const updated = await addCartItemApi({
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          image: item.image,
          price: item.price,
          mrp: item.mrp,
          size: item.size,
          stock: item.stock,
          quantity: item.quantity ?? 1,
          category: item.category,
        });
        const mapped = fromApi(updated);
        setItems(mapped);
        return mapped;
      }
      const updated = addToCartStorage(item);
      setItems(updated);
      return updated;
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (productId: number, size: string, quantity: number) => {
      if (user) {
        const updated = await updateCartItemApi(productId, size, quantity);
        const mapped = fromApi(updated);
        setItems(mapped);
        return mapped;
      }
      const updated = updateQuantityStorage(productId, size, quantity);
      setItems(updated);
      return updated;
    },
    [user]
  );

  const removeFromCart = useCallback(
    async (productId: number, size: string) => {
      if (user) {
        const updated = await removeCartItemApi(productId, size);
        const mapped = fromApi(updated);
        setItems(mapped);
        return mapped;
      }
      const updated = removeFromCartStorage(productId, size);
      setItems(updated);
      return updated;
    },
    [user]
  );

  const clearCart = useCallback(async () => {
    if (user) {
      await clearCartApi();
      setItems([]);
      return;
    }
    clearCartStorage();
    setItems([]);
  }, [user]);

  return {
    items,
    hydrated,
    count: getCartCount(items),
    subtotal: getCartSubtotal(items),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
