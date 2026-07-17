import type { Product } from "@/lib/content";
import { getToken, logout } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  items: { id: number; name: string; quantity: number; price: number }[];
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
  } catch (networkErr: any) {
    // fetch() itself threw — the API is unreachable (wrong host/port, DNS
    // failure, backend not running, etc). Surface the URL so it's obvious
    // at a glance whether NEXT_PUBLIC_API_URL is pointing at the right place.
    throw new Error(
      `Could not reach API at ${url} (${networkErr?.message || "network error"}). ` +
        `Check that the backend is running and NEXT_PUBLIC_API_URL is correct.`
    );
  }
  if (!res.ok) {
    if (res.status === 401) {
      // Session expired or missing — clear any stale token so the UI can
      // fall back to a logged-out state instead of looping on 401s.
      logout();
      throw new Error("You need to be logged in as the owner to do that.");
    }
    if (res.status === 403) {
      throw new Error("You don't have permission to do that.");
    }
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      `Request to ${url} failed: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`
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

export function createOrder(payload: {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  mode: string;
  items: { productId?: number; name: string; quantity: number; price: number }[];
  total: number;
}): Promise<Order> {
  return request<Order>(`/orders`, { method: "POST", body: JSON.stringify(payload) });
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