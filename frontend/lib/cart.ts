// Plain browser-safe cart helpers (no React), following the same pattern as
// lib/auth.ts: state lives in localStorage, and a custom event lets any
// component in the tab (e.g. the header's cart badge) react instantly.
const CART_KEY = "rubyz_cart";
const CART_EVENT = "rubyz-cart-changed";
export const DELIVERY_FEE = 150;

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
};

function readRaw(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): CartItem[] {
  return readRaw();
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }): CartItem[] {
  const items = readRaw();
  const quantity = Math.max(1, item.quantity ?? 1);
  const existing = items.find((i) => i.productId === item.productId && i.size === item.size);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, existing.stock ?? 99);
  } else {
    items.push({ ...item, quantity: Math.min(quantity, item.stock ?? 99) });
  }
  writeRaw(items);
  return items;
}

export function updateQuantity(productId: number, size: string, quantity: number): CartItem[] {
  let items = readRaw();
  if (quantity <= 0) {
    items = items.filter((i) => !(i.productId === productId && i.size === size));
  } else {
    items = items.map((i) =>
      i.productId === productId && i.size === size
        ? { ...i, quantity: Math.min(quantity, i.stock ?? 99) }
        : i
    );
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

export { CART_EVENT };
