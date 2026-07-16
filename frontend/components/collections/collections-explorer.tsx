"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { categories } from "@/lib/content";
import type { Product } from "@/lib/content";

const FABRICS = ["Cotton", "Georgette", "Silk", "Net", "Velvet"];
const MIN_PRICE = 1500;
const MAX_PRICE = 12000;

type SortOption = "Featured" | "Price: Low to High" | "Price: High to Low";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CollectionsExplorer({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<SortOption>("Featured");

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

      const matchesPrice = product.price <= maxPrice;

      return matchesQuery && matchesCategory && matchesFabric && matchesPrice;
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
  }, [products, query, selectedCategories, selectedFabrics, maxPrice, sort]);

  const hasActiveFilters =
    query.trim().length > 0 || selectedCategories.length > 0 || selectedFabrics.length > 0 || maxPrice < MAX_PRICE;

  const clearFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedFabrics([]);
    setMaxPrice(MAX_PRICE);
  };

  return (
    <>
      <div className="flex flex-col gap-6 rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_20px_60px_rgba(17,17,17,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Collections</p>
          <h1 className="mt-2 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
            Curated for celebration, comfort, and couture.
          </h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-black/10 bg-[#F8F5F1] px-4 py-3">
          <Search size={16} className="text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search silhouettes, fabrics, occasions…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")} className="text-gray-400 hover:text-[#111111]">
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
                {categories.map((category) => (
                  <label key={category.name} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => setSelectedCategories((current) => toggle(current, category.name))}
                    />
                    {category.name}
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
                {FABRICS.map((fabric) => (
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
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between rounded-[1rem] border border-black/5 bg-white px-4 py-3 shadow-sm">
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