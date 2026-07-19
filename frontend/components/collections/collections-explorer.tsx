"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { getAttributes } from "@/lib/api";
import type { Product } from "@/lib/content";

const MIN_PRICE = 1500;
const MAX_PRICE = 12000;

type SortOption = "Featured" | "Price: Low to High" | "Price: High to Low";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CollectionsExplorer({ products }: { products: Product[] }) {
  // Seeds the search box from ?q= so the header search's "View all results"
  // link lands here with the term already applied.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<SortOption>("Featured");

  // Filter option lists come from the taxonomy API (the same table the
  // owner dashboard's "add new" dropdowns write to), so any category,
  // fabric, occasion, or color the owner adds shows up here too — falling
  // back to whatever's actually on the current products if the API call
  // hasn't resolved yet.
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [fabricOptions, setFabricOptions] = useState<string[]>([]);
  const [occasionOptions, setOccasionOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);

  useEffect(() => {
    // Keep the search box in sync if the user searches again from the
    // header while already on this page (client-side navigation doesn't
    // remount the component, so the initial useState value won't update).
    setQuery(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q")]);

  useEffect(() => {
    let cancelled = false;
    getAttributes()
      .then((attributes) => {
        if (cancelled) return;
        setCategoryOptions(attributes.filter((a) => a.type === "category").map((a) => a.value));
        setFabricOptions(attributes.filter((a) => a.type === "fabric").map((a) => a.value));
        setOccasionOptions(attributes.filter((a) => a.type === "occasion").map((a) => a.value));
        setColorOptions(attributes.filter((a) => a.type === "color").map((a) => a.value));
      })
      .catch(() => {
        // Fall back to whatever values are present on the loaded products.
        if (cancelled) return;
        const unique = (values: (string | undefined)[]) => Array.from(new Set(values.filter(Boolean))) as string[];
        setCategoryOptions(unique(products.map((p) => p.category)));
        setFabricOptions(unique(products.map((p) => p.fabric)));
        setOccasionOptions(unique(products.map((p) => p.occasion)));
        setColorOptions(unique(products.map((p) => p.color)));
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
        [product.name, product.category, product.fabric, product.occasion, product.color, product.description]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);

      const matchesFabric =
        selectedFabrics.length === 0 ||
        selectedFabrics.some((fabric) => product.fabric?.toLowerCase().includes(fabric.toLowerCase()));

      const matchesOccasion =
        selectedOccasions.length === 0 || selectedOccasions.includes(product.occasion);

      const matchesColor =
        selectedColors.length === 0 || selectedColors.includes(product.color);

      const matchesPrice = product.price <= maxPrice;

      return matchesQuery && matchesCategory && matchesFabric && matchesOccasion && matchesColor && matchesPrice;
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
  }, [products, query, selectedCategories, selectedFabrics, selectedOccasions, selectedColors, maxPrice, sort]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedFabrics.length > 0 ||
    selectedOccasions.length > 0 ||
    selectedColors.length > 0 ||
    maxPrice < MAX_PRICE;

  const clearFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedFabrics([]);
    setSelectedOccasions([]);
    setSelectedColors([]);
    setMaxPrice(MAX_PRICE);
  };

  return (
    <>
      <div className="flex flex-col gap-6 rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(17,17,17,0.06)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Collections</p>
          <h1 className="mt-2 text-2xl text-[#111111] sm:text-3xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Curated for celebration, comfort, and couture.
          </h1>
        </div>
        <div className="flex w-full items-center gap-3 rounded-full border border-black/10 bg-[#F8F5F1] px-4 py-3 lg:w-auto">
          <Search size={16} className="shrink-0 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search silhouettes, fabrics, occasions…"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400 lg:w-56"
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")} className="shrink-0 text-gray-400 hover:text-[#111111]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#B68D40]" />
              <p className="text-sm font-semibold uppercase tracking-[0.28em]">Filters</p>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs uppercase tracking-[0.2em] text-[#B68D40] hover:underline">
                Clear
              </button>
            )}
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-semibold text-[#111111]">Category</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {categoryOptions.map((category) => (
                  <label key={category} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => setSelectedCategories((current) => toggle(current, category))}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">Price</p>
              <div className="mt-3">
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#B68D40]"
                />
                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>₹{MIN_PRICE.toLocaleString()}</span>
                  <span>Up to ₹{maxPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">Fabric</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {fabricOptions.map((fabric) => (
                  <label key={fabric} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(fabric)}
                      onChange={() => setSelectedFabrics((current) => toggle(current, fabric))}
                    />
                    {fabric}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">Occasion</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {occasionOptions.map((occasion) => (
                  <label key={occasion} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(occasion)}
                      onChange={() => setSelectedOccasions((current) => toggle(current, occasion))}
                    />
                    {occasion}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">Color</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {colorOptions.map((color) => (
                  <label key={color} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={() => setSelectedColors((current) => toggle(current, color))}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 rounded-[1rem] border border-black/5 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {query.trim() ? (
                <>Showing {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;</>
              ) : (
                <>Showing {filtered.length} luxurious piece{filtered.length === 1 ? "" : "s"}</>
              )}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-full border border-black/10 bg-[#F8F5F1] px-3 py-2 text-sm"
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-16 text-center">
              <p className="text-lg text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
                No pieces match your search
              </p>
              <p className="mt-2 text-sm text-gray-500">Try a different keyword or clear your filters.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-5 rounded-full bg-[#111111] px-6 py-2.5 text-sm text-white">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => (
                <AnimatedProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
