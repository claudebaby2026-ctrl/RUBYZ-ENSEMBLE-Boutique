"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { useLikes } from "@/lib/useLikes";

export function LikeButton({
  productId,
  className,
}: {
  productId: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLiked, toggleLike, isAuthenticated, loading } = useLikes();
  const [busy, setBusy] = useState(false);
  const liked = isLiked(productId);

  const handleClick = async (e: React.MouseEvent) => {
    // Product cards wrap everything in a <Link> to the product page — stop
    // the click from also triggering navigation.
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await toggleLike(productId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      disabled={loading}
      className={className ?? "rounded-full bg-white/90 p-2 shadow-sm"}
    >
      {busy ? (
        <Loader2 size={15} className="animate-spin text-[#111111]" />
      ) : (
        <Heart size={15} className={liked ? "fill-[#D94F70] text-[#D94F70]" : "text-[#111111]"} />
      )}
    </button>
  );
}
