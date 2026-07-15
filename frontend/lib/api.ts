import type { Product } from "@/lib/content";
import { getToken, logout } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Order = {
  id: string;
  customerName: string;
  phone: string;
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
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
      detail = typeof body.detail === "string" ? body.detail : "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(detail || `API ${path} failed: ${res.status}`);
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

// ---- Orders ----

export function getOrders(): Promise<Order[]> {
  return request<Order[]>(`/orders`);
}

export function createOrder(payload: {
  customerName: string;
  phone: string;
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

// ---- Admin ----

export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>(`/admin/dashboard`);
}
