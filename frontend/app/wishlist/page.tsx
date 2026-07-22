"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useLikes } from "@/lib/useLikes";
import { getLikedProducts } from "@/lib/api";
import type { Product } from "@/lib/content";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Re-render when a like/unlike happens elsewhere (e.g. this page's own
  // cards) so a removed item disappears immediately.
  const { likedIds } = useLikes();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/wishlist");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getLikedProducts()
      .then(setProducts)
      .catch((e) => setError(e?.message || "Could not load your wishlist."))
      .finally(() => setLoading(false));
  }, [user, likedIds]);

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FBFAF8]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
          Your Wishlist
        </h1>
        <p className="mt-2 text-sm text-gray-500">Pieces you&apos;ve saved to come back to.</p>

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading your wishlist…
          </div>
        ) : error ? (
          <p className="mt-10 text-sm text-[#D94F70]">{error}</p>
        ) : products.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 py-10 text-center">
            <Heart size={36} className="text-[#B68D40]" />
            <p className="text-sm text-gray-500">Nothing here yet — tap the heart on any piece to save it.</p>
            <Link href="/collections" className="rounded-full bg-[#111111] px-6 py-3 text-sm text-white">
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
            {products.map((product) => (
              <AnimatedProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
