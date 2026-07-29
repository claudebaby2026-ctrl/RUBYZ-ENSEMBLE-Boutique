"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { getAttributes } from "@/lib/api";
import type { Product } from "@/lib/content";
import { isUnstitchedProduct } from "@/lib/tailoring";

type ProductType = "all" | "stitched" | "unstitched";

// Fallback bounds only for the (should-be-impossible) case of an empty
// catalog — real bounds are derived from the actual products below so the
// slider always matches what's really in stock.
const FALLBACK_MIN_PRICE = 0;
const FALLBACK_MAX_PRICE = 10000;

type SortOption = "Featured" | "Price: Low to High" | "Price: High to Low";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CollectionsExplorer({ products }: { products: Product[] }) {
  // Seeds the search box from ?q= so the header search's "View all results"
  // link lands here with the term already applied.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  // Seeds the category filter from ?category= so the homepage's "Shop by
  // Category" cards land here pre-filtered instead of on the full catalog.
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const category = searchParams.get("category");
    return category ? [category] : [];
  });
  // The client's primary, top-level split — every product is either
  // Stitched/Ready-made or Unstitched. Seeded from ?type= so the footer's
  // Shop links land here pre-filtered, same pattern as ?category=.
  const [selectedType, setSelectedType] = useState<ProductType>(() => {
    const type = searchParams.get("type");
    return type === "stitched" || type === "unstitched" ? type : "all";
  });
  // Derived from the real catalog rather than hardcoded, so the slider's
  // bounds always reflect what's actually for sale.
  const MIN_PRICE = products.length ? Math.min(...products.map((p) => p.price)) : FALLBACK_MIN_PRICE;
  const MAX_PRICE = products.length ? Math.max(...products.map((p) => p.price)) : FALLBACK_MAX_PRICE;

  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  // Keep the slider's ceiling in sync if `products` loads/changes after
  // mount (e.g. first render before data arrives).
  useEffect(() => {
    setMaxPrice(MAX_PRICE);
  }, [MAX_PRICE]);
  const [sort, setSort] = useState<SortOption>("Featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while the mobile filter drawer is open.
  useEffect(() => {
    if (filtersOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [filtersOpen]);

  // Filter option list comes from the taxonomy API (the same table the
  // owner dashboard's "add new" dropdown writes to), so any category the
  // owner adds shows up here too — falling back to whatever's actually on
  // the current products if the API call hasn't resolved yet.
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    // Keep the search box in sync if the user searches again from the
    // header while already on this page (client-side navigation doesn't
    // remount the component, so the initial useState value won't update).
    setQuery(searchParams.get("q") ?? "");
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategories((current) => (current.includes(category) ? current : [category]));
    }
    const type = searchParams.get("type");
    if (type === "stitched" || type === "unstitched") {
      setSelectedType(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q"), searchParams.get("category"), searchParams.get("type")]);

  useEffect(() => {
    let cancelled = false;
    getAttributes()
      .then((attributes) => {
        if (cancelled) return;
        setCategoryOptions(attributes.filter((a) => a.type === "category").map((a) => a.value));
      })
      .catch(() => {
        // Fall back to whatever values are present on the loaded products.
        if (cancelled) return;
        const unique = (values: (string | undefined)[]) => Array.from(new Set(values.filter(Boolean))) as string[];
        setCategoryOptions(unique(products.map((p) => p.category)));
      });
    return () => {
      cancelled = true;
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = products.filter((product) => {
      const matchesQuery =
        q.length === 0 ||
        [product.name, product.category, product.fabric, product.description]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q));

      const matchesType =
        selectedType === "all" ||
        (selectedType === "unstitched") === isUnstitchedProduct(product.category, product.fabric);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);

      const matchesPrice = product.price <= maxPrice;

      return matchesType && matchesQuery && matchesCategory && matchesPrice;
    });

    if (sort === "Price: Low to High") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: High to Low") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else {
      // "Featured" — featured & bestseller pieces first, then the rest.
      result = [...result].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isBestseller) - Number(a.isBestseller));
    }

    return result;
  }, [products, query, selectedType, selectedCategories, maxPrice, sort]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedType !== "all" ||
    selectedCategories.length > 0 ||
    maxPrice < MAX_PRICE;

  // Count of active filter *facets* (excludes the search box, which has its
  // own visible input) — drives the badge on the mobile Filters button.
  const activeFilterCount =
    selectedCategories.length +
    (maxPrice < MAX_PRICE ? 1 : 0);

  const clearFilters = () => {
    setQuery("");
    setSelectedType("all");
    setSelectedCategories([]);
    setMaxPrice(MAX_PRICE);
  };

  // Shared between the desktop sidebar and the mobile drawer so the two
  // never drift out of sync.
  const filterFields = (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#3A2213]">Category</p>
        <div className="mt-3 space-y-2 text-sm text-[#7A6D65]">
          {categoryOptions.map((category) => (
            <label key={category} className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => setSelectedCategories((current) => toggle(current, category))}
                className="h-4 w-4 accent-[#B17F5E]"
              />
              {category}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#3A2213]">Price</p>
        <div className="mt-3">
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#B17F5E]"
          />
          <div className="mt-2 flex justify-between text-sm text-[#7A6D65]">
            <span>₹{MIN_PRICE.toLocaleString()}</span>
            <span>Up to ₹{maxPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6 rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-5 shadow-[0_20px_60px_rgba(17,17,17,0.06)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Collections</p>
          <h1 className="mt-2 text-2xl text-[#3A2213] sm:text-3xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Curated for celebration, comfort, and couture.
          </h1>
        </div>
        <div className="flex w-full items-center gap-3 rounded-full border border-[#3A2213]/12 bg-[#E9CFBA] px-4 py-3 lg:w-auto">
          <Search size={16} className="shrink-0 text-[#8B7A6E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search silhouettes, fabrics, categories…"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A8968A] lg:w-56"
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")} className="shrink-0 text-[#A8968A] hover:text-[#3A2213]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Primary, client-mandated split — every product is either
          Stitched/Ready-made or Unstitched. Kept as its own prominent tab
          row (not folded into the sidebar checkboxes) so it reads as the
          top-level category, not just another facet. Mobile gets a fixed
          3-up grid with short labels so it doesn't wrap into a blob inside
          the rounded container; sm+ switches to an auto-width pill row. */}
      <div className="mt-6 grid grid-cols-3 gap-1.5 rounded-2xl border border-[#3A2213]/12 bg-[#FFFBF5] p-1.5 shadow-sm sm:inline-flex sm:w-auto sm:gap-2 sm:rounded-full">
        {(
          [
            { value: "all", label: "All Collections", short: "All" },
            { value: "stitched", label: "Stitched / Ready-made", short: "Stitched" },
            { value: "unstitched", label: "Unstitched", short: "Unstitched" },
          ] as { value: ProductType; label: string; short: string }[]
        ).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedType(tab.value)}
            className={`rounded-full px-2 py-2.5 text-center text-xs font-medium leading-tight transition sm:px-5 sm:text-sm ${
              selectedType === tab.value
                ? "bg-[#3A2213] text-white"
                : "text-[#7A6D65] hover:bg-[#E9CFBA]"
            }`}
          >
            <span className="sm:hidden">{tab.short}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar — always visible from lg upward. */}
        <aside className="hidden h-fit rounded-[1.5rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm lg:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#B17F5E]" />
              <p className="text-sm font-semibold uppercase tracking-[0.28em]">Filters</p>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs uppercase tracking-[0.2em] text-[#B17F5E] hover:underline">
                Clear
              </button>
            )}
          </div>
          <div className="mt-6">{filterFields}</div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 rounded-[1rem] border border-[#3A2213]/8 bg-[#FFFBF5] px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#7A6D65]">
              {query.trim() ? (
                <>Showing {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;</>
              ) : (
                <>Showing {filtered.length} luxurious piece{filtered.length === 1 ? "" : "s"}</>
              )}
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile/tablet-only trigger — the sidebar above is hidden below lg,
                  so this is the only way to reach filters on a phone. */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="relative flex items-center gap-2 rounded-full border border-[#3A2213]/12 bg-[#E9CFBA] px-4 py-2 text-sm lg:hidden"
              >
                <SlidersHorizontal size={15} className="text-[#B17F5E]" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3A2213] px-1 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-full border border-[#3A2213]/12 bg-[#E9CFBA] px-3 py-2 text-sm"
              >
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[#3A2213]/12 bg-[#FFFBF5] p-10 text-center sm:p-16">
              <p className="text-lg text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
                No pieces match your search
              </p>
              <p className="mt-2 text-sm text-[#8B7A6E]">Try a different keyword or clear your filters.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-5 rounded-full bg-[#3A2213] px-6 py-2.5 text-sm text-white">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
              {filtered.map((product) => (
                <AnimatedProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer — portaled to <body>, slides in from the left,
          mirrors the same filter fields as the desktop sidebar. */}
      {mounted && filtersOpen && createPortal(
        <div className="lg:hidden">
          <button
            aria-label="Close filters overlay"
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex h-full w-[86vw] max-w-sm flex-col bg-[#FFFBF5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3A2213]/8 px-5 py-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#B17F5E]" />
                <p className="text-sm font-semibold uppercase tracking-[0.28em]">Filters</p>
              </div>
              <button
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-[#3A2213]/12 p-2"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">{filterFields}</div>

            <div className="flex gap-3 border-t border-[#3A2213]/8 px-5 py-4">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-1 rounded-full border border-[#3A2213]/12 px-4 py-3 text-sm font-medium text-[#3A2213]"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-full bg-[#3A2213] px-4 py-3 text-sm font-medium text-white"
              >
                Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
