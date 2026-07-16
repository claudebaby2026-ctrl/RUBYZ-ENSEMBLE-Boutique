"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CART_EVENT,
  type CartItem,
  addToCart as addToCartStorage,
  clearCart as clearCartStorage,
  getCart,
  getCartCount,
  getCartSubtotal,
  removeFromCart as removeFromCartStorage,
  updateQuantity as updateQuantityStorage,
} from "@/lib/cart";

/**
 * Reactive cart state backed by localStorage. Stays in sync across every
 * component in the tab (header badge, cart page, checkout) via the
 * "rubyz-cart-changed" custom event, the same pattern useAuth uses for
 * session state.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setItems(getCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const add: typeof addToCartStorage = useCallback((item) => {
    const updated = addToCartStorage(item);
    setItems(updated);
    return updated;
  }, []);

  const updateQuantity = useCallback((productId: number, size: string, quantity: number) => {
    const updated = updateQuantityStorage(productId, size, quantity);
    setItems(updated);
    return updated;
  }, []);

  const remove = useCallback((productId: number, size: string) => {
    const updated = removeFromCartStorage(productId, size);
    setItems(updated);
    return updated;
  }, []);

  const clear = useCallback(() => {
    clearCartStorage();
    setItems([]);
  }, []);

  return {
    items,
    hydrated,
    count: getCartCount(items),
    subtotal: getCartSubtotal(items),
    addToCart: add,
    updateQuantity,
    removeFromCart: remove,
    clearCart: clear,
  };
}
