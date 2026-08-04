"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type AuthUser, fetchMe, getStoredUser, getToken, logout as logoutSession } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isOwner: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds auth state for the whole app in one place. Reads the cached user
 * instantly from localStorage (so the UI doesn't flash logged-out), then
 * verifies the token against `/auth/me` in the background and stays in
 * sync across tabs/components via the "rubyz-auth-changed" and "storage"
 * events.
 *
 * Mounted once in app/layout.tsx — every `useAuth()` call reads from this
 * single instance instead of each component running its own fetch.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(getStoredUser());
    const verified = await fetchMe();
    setUser(verified);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("rubyz-auth-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("rubyz-auth-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const logout = useCallback(() => {
    logoutSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isOwner: user?.role === "owner", logout, refresh }),
    [user, loading, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reactive auth state. Same return shape as the old standalone hook — this
 * is now a thin useContext() wrapper around the single AuthProvider
 * instance mounted in app/layout.tsx, so every caller shares one `/auth/me`
 * fetch instead of firing its own.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
