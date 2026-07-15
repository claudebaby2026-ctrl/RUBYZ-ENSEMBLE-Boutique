// Plain browser-safe helpers (no React) — intentionally NOT "use client" so
// they can be safely imported by lib/api.ts, which is used from both server
// components (product/collection pages) and client components (dashboard).
// Every localStorage/window access below is guarded for the server.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "rubyz_token";
const USER_KEY = "rubyz_user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "owner" | "customer";
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

// ---- Token / user storage (localStorage, client-side only) ----

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function storeSession(data: AuthResponse) {
  window.localStorage.setItem(TOKEN_KEY, data.access_token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  // Notify any listeners in this tab (storage event only fires cross-tab).
  window.dispatchEvent(new Event("rubyz-auth-changed"));
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("rubyz-auth-changed"));
}

// ---- API calls ----

async function authRequest(path: string, body: unknown): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    } catch {
      // ignore parse errors, use default message
    }
    throw new Error(message);
  }
  const data = (await res.json()) as AuthResponse;
  storeSession(data);
  return data;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return authRequest("/auth/login", { email, password });
}

export function register(payload: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  return authRequest("/auth/register", payload);
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    // Token expired/invalid — clear the stale session.
    logout();
    return null;
  }
  const user = (await res.json()) as AuthUser;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
