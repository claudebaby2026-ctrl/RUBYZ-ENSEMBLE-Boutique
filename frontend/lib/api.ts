import type { Product } from "@/lib/content";
import { getToken, logout } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Thrown by request() for any non-2xx response. `status` lets callers branch
// on the kind of failure (e.g. 400 = "fix your cart/input", 429 = "slow
// down") without parsing the message string. `message` is the backend's own
// `detail` when it sent one (already human-readable, e.g. "Only 1 unit(s)
// of 'X' left in stock") — falling back to a generic description only when
// the backend didn't provide one.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Product images are stored as paths relative to the API origin
// (e.g. "/static/uploads/xyz.jpg"). This resolves them to a full URL the
// browser can load regardless of which origin the frontend is served from.
export function resolveImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  mode: string;
  status: string;
  total: number;
  couponCode?: string | null;
  discount?: number;
  paymentStatus?: string;
  razorpayPaymentId?: string | null;
  createdAt: string;
  items: { id: number; name: string; quantity: number; price: number }[];
  // --- Shiprocket shipment tracking ---
  // shipmentStatus defaults to "not_created" before any shipment attempt.
  // Once a webhook updates it, the backend stores it lowercase-with-
  // underscores (e.g. "out_for_delivery"); before that it may be one of
  // "not_created" / "pending" / "created" / "failed". Callers that render
  // this to a customer should handle both forms — see humanizeShipmentStatus.
  shipmentStatus?: string;
  awbCode?: string | null;
  courierName?: string | null;
};

// Turns a raw shipment_status value (either the pre-webhook enum or a
// lowercase-with-underscores string straight from a Shiprocket webhook)
// into something readable, without needing the backend to normalize it.
export function humanizeShipmentStatus(status?: string | null): string {
  if (!status) return "Not shipped yet";
  return status
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// ---- Payments (Razorpay) ----

export type RazorpayOrder = {
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
};

export type DashboardStats = {
  todayOrders: number;
  pendingOrders: number;
  revenueToday: number;
  lowStockItems: number;
};

export type ProductInput = Omit<Product, "id"> & { stock?: number };

// ---- Attributes (category / occasion / color / fabric taxonomy) ----

export type AttributeType = "category" | "occasion" | "color" | "fabric";

export type Attribute = {
  id: number;
  type: AttributeType;
  value: string;
};

// ---- Coupons ----

export type Coupon = {
  id: number;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  active: boolean;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

export type CouponInput = {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  usage_limit?: number | null;
  expires_at?: string | null;
};

// ---- Customers ----

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

// ---- Shipping (Shiprocket) ----

export type ShippingDefaultRow = {
  category: string;
  weight: number;
  length: number;
  breadth: number;
  height: number;
};

export type ShippingDefaults = {
  rows: ShippingDefaultRow[];
};

export type RateQuoteItem = {
  productId?: number;
  category: string;
  quantity: number;
};

export type RateQuote = {
  fee: number;
  // True when this is the live Shiprocket-computed rate; false when it's
  // the flat DELIVERY_FEE fallback (Shiprocket unconfigured/unreachable/
  // erroring, or the cart has nothing shippable in it).
  live: boolean;
  courierName?: string | null;
};

// ---- Homepage editor ----

export type HomepageConfig = {
  hero_heading: string;
  hero_subheading: string;
  banner_text: string;
  featured_product_ids: number[];
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
      // Product/order data changes often from the owner dashboard, so avoid
      // Next.js's default fetch caching for these calls.
      cache: "no-store",
    });
  } catch (networkErr) {
    // fetch() itself threw — the API is unreachable (wrong host/port, DNS
    // failure, backend not running, etc). Surface the URL so it's obvious
    // at a glance whether NEXT_PUBLIC_API_URL is pointing at the right place.
    throw new Error(
      `Could not reach API at ${url} (${networkErr instanceof Error ? networkErr.message : "network error"}). ` +
        `Check that the backend is running and NEXT_PUBLIC_API_URL is correct.`
    );
  }
  if (!res.ok) {
    if (res.status === 401) {
      // Session expired or missing — clear any stale token so the UI can
      // fall back to a logged-out state instead of looping on 401s.
      logout();
      throw new ApiError("You need to be logged in as the owner to do that.", 401);
    }
    if (res.status === 403) {
      throw new ApiError("You don't have permission to do that.", 403);
    }
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      detail = await res.text().catch(() => "");
    }
    // Prefer the backend's own message (e.g. a stock/price-validation 400
    // from POST /orders) — it's already written for a customer to read.
    // Only fall back to the technical wrapper when the backend sent
    // nothing usable.
    throw new ApiError(
      detail || `Request to ${url} failed: ${res.status} ${res.statusText}`,
      res.status
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Products ----

export function getProducts(category?: string): Promise<Product[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return request<Product[]>(`/products${query}`);
}

export function getProductBySlug(slug: string): Promise<Product | null> {
  return request<Product>(`/products/slug/${encodeURIComponent(slug)}`).catch(() => null);
}

export function createProduct(payload: ProductInput): Promise<Product> {
  return request<Product>(`/products`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateProduct(id: number, payload: Partial<ProductInput>): Promise<Product> {
  return request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteProduct(id: number): Promise<void> {
  return request<void>(`/products/${id}`, { method: "DELETE" });
}

// Uploads a product photo (owner-only). Uses FormData directly instead of
// the JSON `request` helper since this is a multipart upload.
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/uploads/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    if (res.status === 401) {
      logout();
      throw new Error("You need to be logged in as the owner to do that.");
    }
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export function getAttributes(type?: AttributeType): Promise<Attribute[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return request<Attribute[]>(`/attributes${query}`);
}

// Owner-only. Persists a brand-new category/occasion/color/fabric value so
// it shows up as an option everywhere (dashboard dropdowns + storefront
// filters) from then on.
export function createAttribute(type: AttributeType, value: string): Promise<Attribute> {
  return request<Attribute>(`/attributes`, { method: "POST", body: JSON.stringify({ type, value }) });
}

// ---- Orders ----

export function getOrders(): Promise<Order[]> {
  return request<Order[]>(`/orders`);
}

// Customer-only — the signed-in customer's own orders, newest first.
// Backs the "My Orders" page.
export function getMyOrders(): Promise<Order[]> {
  return request<Order[]>(`/orders/me`);
}

export function createOrder(payload: {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  // Structured billing address — required by Shiprocket for shipment
  // creation. Only meaningful (and only sent) for Delivery-mode orders;
  // the checkout page omits these for Pickup.
  pincode?: string;
  city?: string;
  state?: string;
  mode: string;
  items: { productId?: number; name: string; quantity: number; price: number }[];
  total: number;
  couponCode?: string;
  // Proof of payment from Razorpay checkout.js's success handler. The
  // backend re-verifies the signature server-side before creating the
  // order — see crud/order.py::create_order — so these three are
  // required for every order now that checkout is Razorpay-only.
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Order> {
  return request<Order>(`/orders`, { method: "POST", body: JSON.stringify(payload) });
}

// Owner-only manual retry for a failed/not-yet-created shipment. On
// success the backend returns the new tracking fields directly (not a
// full Order) so the dashboard can patch just that row; on failure it
// throws an ApiError with status 502 and a human-readable detail.
export function retryShipment(
  displayId: string
): Promise<{ shipmentStatus: string; awbCode: string | null; courierName: string | null }> {
  return request(`/orders/${encodeURIComponent(displayId)}/create-shipment`, { method: "POST" });
}

// Public — used by checkout to get a live courier rate for the cart +
// pincode, replacing the flat delivery fee when available. Always resolves
// (never throws for a normal unconfigured/unreachable Shiprocket state —
// the backend itself falls back to the flat fee), so callers can treat a
// non-2xx here as unexpected.
export function getShippingRate(payload: {
  pincode: string;
  items: RateQuoteItem[];
}): Promise<RateQuote> {
  return request<RateQuote>(`/shipping/rate`, { method: "POST", body: JSON.stringify(payload) });
}

// ---- Shipping Defaults (owner-only) ----

export function getShippingDefaults(): Promise<ShippingDefaults> {
  return request<ShippingDefaults>(`/shipping-defaults`);
}

// Full replace, same style as updateHomepageConfig — always send every row
// back together.
export function updateShippingDefaults(payload: ShippingDefaults): Promise<ShippingDefaults> {
  return request<ShippingDefaults>(`/shipping-defaults`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Step 1 of checkout: ask the backend to price the cart (server-side,
// from the DB — never the client's numbers) and open a matching Razorpay
// order. Returns the razorpayOrderId + amount + the Razorpay key id to
// hand to checkout.js.
export function createRazorpayOrder(payload: {
  mode: string;
  items: { productId?: number; name: string; quantity: number; price: number }[];
  couponCode?: string;
}): Promise<RazorpayOrder> {
  return request<RazorpayOrder>(`/payments/create-razorpay-order`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOrderStatus(displayId: string, status: string): Promise<Order> {
  return request<Order>(`/orders/${encodeURIComponent(displayId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---- Likes / Wishlist ----

export function getLikedProducts(): Promise<Product[]> {
  return request<Product[]>(`/likes`);
}

export function getLikedProductIds(): Promise<number[]> {
  return request<number[]>(`/likes/ids`);
}

export function likeProduct(productId: number): Promise<{ liked: boolean }> {
  return request(`/likes/${productId}`, { method: "POST" });
}

export function unlikeProduct(productId: number): Promise<void> {
  return request<void>(`/likes/${productId}`, { method: "DELETE" });
}

// ---- Admin ----

export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>(`/admin/dashboard`);
}

export function getCustomers(): Promise<Customer[]> {
  return request<Customer[]>(`/admin/customers`);
}

// ---- Coupons ----

export function getCoupons(): Promise<Coupon[]> {
  return request<Coupon[]>(`/coupons`);
}

// Public — used by the checkout page to check a code before applying it.
export function validateCoupon(code: string): Promise<Coupon> {
  return request<Coupon>(`/coupons/validate/${encodeURIComponent(code)}`);
}

export function createCoupon(payload: CouponInput): Promise<Coupon> {
  return request<Coupon>(`/coupons`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateCoupon(id: number, payload: Partial<{ active: boolean; discount_value: number; usage_limit: number | null; expires_at: string | null }>): Promise<Coupon> {
  return request<Coupon>(`/coupons/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteCoupon(id: number): Promise<void> {
  return request<void>(`/coupons/${id}`, { method: "DELETE" });
}

// ---- Homepage editor ----

export function getHomepageConfig(): Promise<HomepageConfig> {
  return request<HomepageConfig>(`/homepage`);
}

export function updateHomepageConfig(payload: HomepageConfig): Promise<HomepageConfig> {
  return request<HomepageConfig>(`/homepage`, { method: "PUT", body: JSON.stringify(payload) });
}