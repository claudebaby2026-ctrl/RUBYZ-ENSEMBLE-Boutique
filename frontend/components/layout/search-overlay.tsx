"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { getProducts, resolveImageUrl } from "@/lib/api";
import type { Product } from "@/lib/content";

const RESULT_LIMIT = 6;

function matches(product: Product, q: string) {
  return [product.name, product.category, product.fabric, product.occasion, product.color, product.description]
    .filter(Boolean)
    .some((field) => (field as string).toLowerCase().includes(q));
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load the catalog once, the first time the overlay is opened, then reuse
  // it for every subsequent open/search — no need to refetch on every
  // keystroke since this is a small boutique catalog, not a paginated one.
  useEffect(() => {
    if (!open || products || loading) return;
    setLoading(true);
    setError(null);
    getProducts()
      .then((data) => setProducts(data))
      .catch(() => setError("Couldn't load the catalog. Please try again."))
      .finally(() => setLoading(false));
  }, [open, products, loading]);

  useEffect(() => {
    if (open) {
      // Focus the input once it's actually in the DOM.
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(id);
        document.body.style.overflow = original;
      };
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();
  const results = q.length === 0 || !products ? [] : products.filter((p) => matches(p, q)).slice(0, RESULT_LIMIT);

  function goToResults() {
    if (!query.trim()) return;
    router.push(`/collections?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close search"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 z-[70] mx-auto w-full max-w-2xl px-4 pt-4 sm:pt-16"
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-2xl">
              <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
                <Search size={18} className="shrink-0 text-[#B68D40]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToResults();
                  }}
                  placeholder="Search silhouettes, fabrics, occasions…"
                  className="w-full min-w-0 bg-transparent text-base text-[#111111] outline-none placeholder:text-gray-400"
                />
                <button
                  onClick={onClose}
                  aria-label="Close search"
                  className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-[#F8F5F1] hover:text-[#111111]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" /> Loading catalog…
                  </div>
                )}

                {!loading && error && <p className="px-4 py-8 text-center text-sm text-[#D94F70]">{error}</p>}

                {!loading && !error && q.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    Start typing to search across every piece in the boutique.
                  </p>
                )}

                {!loading && !error && q.length > 0 && results.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    No pieces match &ldquo;{query.trim()}&rdquo;. Try a different keyword.
                  </p>
                )}

                {!loading &&
                  results.map((product) => {
                    const image = resolveImageUrl(product.images?.[0]);
                    return (
                      <a
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 rounded-[1rem] px-3 py-2.5 transition hover:bg-[#F8F5F1]"
                      >
                        {image ? (
                          <img src={image} alt={product.name} className="h-14 w-14 shrink-0 rounded-[0.7rem] object-cover" />
                        ) : (
                          <div className="h-14 w-14 shrink-0 rounded-[0.7rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[#111111]">{product.name}</p>
                          <p className="truncate text-xs uppercase tracking-[0.2em] text-gray-400">
                            {[product.category, product.color].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <p className="ml-auto shrink-0 text-sm text-[#B68D40]">₹{product.price.toLocaleString()}</p>
                      </a>
                    );
                  })}
              </div>

              {q.length > 0 && (
                <button
                  onClick={goToResults}
                  className="flex w-full items-center justify-center gap-2 border-t border-black/5 px-5 py-3.5 text-xs uppercase tracking-[0.24em] text-[#111111] hover:bg-[#F8F5F1]"
                >
                  View all results for &ldquo;{query.trim()}&rdquo; <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
