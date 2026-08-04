"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLikedProductIds, likeProduct, unlikeProduct } from "@/lib/api";
import { useAuth } from "@/lib/auth-provider";

const LIKES_EVENT = "rubyz-likes-changed";

type LikesContextValue = {
  likedIds: Set<number>;
  loading: boolean;
  isAuthenticated: boolean;
  isLiked: (productId: number) => boolean;
  toggleLike: (productId: number) => Promise<void>;
};

const LikesContext = createContext<LikesContextValue | null>(null);

/**
 * Holds wishlist state for the whole app in one place. Loads the signed-in
 * customer's liked product IDs from the API and stays in sync across every
 * component in the tab (header, product cards, wishlist page) via the
 * "rubyz-likes-changed" custom event.
 *
 * Mounted once in app/layout.tsx, inside AuthProvider (it depends on the
 * signed-in user) — so a grid of 30 product cards shares one `GET
 * /likes/ids` fetch instead of each LikeButton firing its own.
 */
export function LikesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLikedIds(new Set());
      setLoading(false);
      return;
    }
    try {
      const ids = await getLikedProductIds();
      setLikedIds(new Set(ids));
    } catch {
      setLikedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
    window.addEventListener(LIKES_EVENT, refresh);
    return () => window.removeEventListener(LIKES_EVENT, refresh);
  }, [authLoading, refresh]);

  const toggleLike = useCallback(
    async (productId: number) => {
      if (!user) return;
      const wasLiked = likedIds.has(productId);

      // Optimistic update so the heart responds instantly.
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasLiked) await unlikeProduct(productId);
        else await likeProduct(productId);
        window.dispatchEvent(new Event(LIKES_EVENT));
      } catch (e) {
        // Revert on failure.
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw e;
      }
    },
    [user, likedIds]
  );

  const value = useMemo(
    () => ({
      likedIds,
      loading: authLoading || loading,
      isAuthenticated: !!user,
      isLiked: (productId: number) => likedIds.has(productId),
      toggleLike,
    }),
    [likedIds, authLoading, loading, user, toggleLike]
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

/**
 * Reactive wishlist state. Same return shape as the old standalone hook —
 * now a thin useContext() wrapper around the single LikesProvider instance
 * mounted in app/layout.tsx.
 *
 * Liking is account-based (not stored in localStorage), so `toggleLike` is
 * a no-op for signed-out visitors — callers should check `isAuthenticated`
 * and send them to /login first.
 */
export function useLikes(): LikesContextValue {
  const ctx = useContext(LikesContext);
  if (!ctx) {
    throw new Error("useLikes must be used within a LikesProvider");
  }
  return ctx;
}
