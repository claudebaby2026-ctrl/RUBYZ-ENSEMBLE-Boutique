// Plain browser-safe cart helpers (no React), following the same pattern as
// lib/auth.ts: state lives in localStorage, and a custom event lets any
// component in the tab (e.g. the header's cart badge) react instantly.
import { getStoredUser } from "@/lib/auth";

const CART_KEY_PREFIX = "rubyz_cart";
const CART_EVENT = "rubyz-cart-changed";
// Shipping charge per suit (see Shipping Policy) — charged per unit in the
// cart, not a single flat fee for the whole order.
export const DELIVERY_FEE_PER_ITEM = 100;

// Storewide automatic discount applied to every cart's subtotal — never to
// the delivery fee, and unrelated to whatever MRP-vs-price markdown a
// product page already shows. Applies automatically, with no coupon code
// needed. Must match backend Settings.AUTO_DISCOUNT_PERCENT
// (backend/app/config.py) — this constant is display-only; the backend
// independently recomputes the real discount/total server-side in
// app/crud/order.py::price_cart, so the amount actually charged can never
// drift from what's shown here even if this constant gets out of sync.
export const AUTO_DISCOUNT_PERCENT = 10;

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  image?: string;
  price: number;
  mrp: number;
  size: string;
  stock?: number;
  quantity: number;
  // Product category at the time it was added — used by checkout's live
  // shipping-rate lookup (POST /shipping/rate needs a category per item to
  // exclude Tailoring Services and pick the right per-category default).
  // Optional/undefined for carts added before this field existed; checkout
  // falls back gracefully when it's missing (see app/checkout/page.tsx).
  category?: string;
};

// The cart is namespaced per signed-in account (falling back to a shared
// "guest" bucket when logged out) so logging out and logging into a
// different account in the same browser never shows you someone else's
// cart. getStoredUser() reads whatever's currently in localStorage, so this
// stays correct the instant a login/logout happens — no extra plumbing
// needed here.
function cartKey(): string {
  const user = getStoredUser();
  return user ? `${CART_KEY_PREFIX}_${user.id}` : `${CART_KEY_PREFIX}_guest`;
}

function readRaw(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cartKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartKey(), JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): CartItem[] {
  return readRaw();
}

// RUBYZ keeps exactly one piece per suit, so a cart line's quantity is
// always exactly 1 — there's nothing to "add more" of once a product's
// single piece is already in the cart.
export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }): CartItem[] {
  const items = readRaw();
  const existing = items.find((i) => i.productId === item.productId && i.size === item.size);
  if (!existing) {
    items.push({ ...item, quantity: 1 });
  }
  writeRaw(items);
  return items;
}

export function updateQuantity(productId: number, size: string, quantity: number): CartItem[] {
  let items = readRaw();
  if (quantity <= 0) {
    items = items.filter((i) => !(i.productId === productId && i.size === size));
  }
  writeRaw(items);
  return items;
}

export function removeFromCart(productId: number, size: string): CartItem[] {
  const items = readRaw().filter((i) => !(i.productId === productId && i.size === size));
  writeRaw(items);
  return items;
}

export function clearCart(): void {
  writeRaw([]);
}

export function getCartCount(items?: CartItem[]): number {
  return (items ?? readRaw()).reduce((sum, i) => sum + i.quantity, 0);
}

export function getCartSubtotal(items?: CartItem[]): number {
  return (items ?? readRaw()).reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// Total shipping charge for the cart: ₹100 per suit (per unit), not a flat
// fee for the whole order. Call sites multiply this by 0 when delivery
// isn't selected (e.g. in-store pickup).
export function getCartDeliveryFee(items?: CartItem[]): number {
  return getCartCount(items) * DELIVERY_FEE_PER_ITEM;
}

// The automatic 10% discount, computed off a given amount (pass the
// subtotal, or the subtotal after a coupon discount — never the delivery
// fee). Floored to whole rupees to match the backend's integer math.
export function getAutoDiscount(amount: number): number {
  return Math.floor((Math.max(0, amount) * AUTO_DISCOUNT_PERCENT) / 100);
}

export { CART_EVENT };
