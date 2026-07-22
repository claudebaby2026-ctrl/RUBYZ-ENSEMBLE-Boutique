import type { Product } from "@/lib/content";
import { getStockLabel, getStockStatus } from "@/lib/stock";

const STATUS_CLASSES: Record<string, string> = {
  "out-of-stock": "text-[#B3261E]",
  "low-stock": "text-[#B3261E]",
  "in-stock": "text-[#B68D40]",
};

/**
 * Compact inline label used on product cards — replaces the old
 * `{product.availability}` span that rendered every status (including
 * "Out of stock") in the same brand-gold color.
 */
export function StockBadge({
  product,
  className = "",
}: {
  product: Pick<Product, "stock" | "availability">;
  className?: string;
}) {
  const status = getStockStatus(product);
  return (
    <span className={`${STATUS_CLASSES[status]} ${className}`}>{getStockLabel(product)}</span>
  );
}

/**
 * Standalone ribbon overlaid on the product image for out-of-stock items,
 * so unavailability is visible at a glance while scanning a grid, not just
 * readable in small print underneath.
 */
export function OutOfStockRibbon({ product }: { product: Pick<Product, "stock" | "availability"> }) {
  if (getStockStatus(product) !== "out-of-stock") return null;
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-[#B3261E] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm">
      Out of Stock
    </div>
  );
}
