"use client";

import { useCallback, useEffect, useState } from "react";
import { getLikedProductIds, likeProduct, unlikeProduct } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const LIKES_EVENT = "rubyz-likes-changed";

/**
 * Reactive wishlist state. Loads the signed-in customer's liked product IDs
 * from the API and stays in sync across every component in the tab (header,
 * product cards, wishlist page) via the "rubyz-likes-changed" custom event —
 * the same pattern useCart/useAuth use for their state.
 *
 * Liking is account-based (not stored in localStorage), so `toggleLike` is a
 * no-op for signed-out visitors — callers should check `isAuthenticated` and
 * send them to /login first.
 */
export function useLikes() {
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

  return {
    likedIds,
    loading: authLoading || loading,
    isAuthenticated: !!user,
    isLiked: (productId: number) => likedIds.has(productId),
    toggleLike,
  };
}
