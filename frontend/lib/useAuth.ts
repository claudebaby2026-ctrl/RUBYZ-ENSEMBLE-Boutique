"use client";

import { useCallback, useEffect, useState } from "react";
import { type AuthUser, fetchMe, getStoredUser, getToken, logout as logoutSession } from "@/lib/auth";

/**
 * Reactive auth state. Reads the cached user instantly from localStorage
 * (so the UI doesn't flash logged-out), then verifies the token against
 * `/auth/me` in the background and stays in sync across tabs/components via
 * the "rubyz-auth-changed" and "storage" events.
 */
export function useAuth() {
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

  return { user, loading, isOwner: user?.role === "owner", logout, refresh };
}
