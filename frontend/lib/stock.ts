import type { Product } from "@/lib/content";

// RUBYZ keeps exactly one piece per suit — every product is a single,
// one-of-a-kind unit, so stock is binary (0 or 1). There's no "low stock"
// state in between: a product is either the one available piece, or it's
// already sold.
export type StockStatus = "out-of-stock" | "in-stock";

/**
 * Single source of truth for "is this product actually purchasable" —
 * derived primarily from the numeric `stock` count (when the backend
 * provides one), falling back to the free-text `availability` string for
 * older/seed data that predates per-product stock counts.
 */
export function getStockStatus(product: Pick<Product, "stock" | "availability">): StockStatus {
  const stock = product.stock;
  const availability = (product.availability ?? "").toLowerCase();

  if (typeof stock === "number") {
    return stock <= 0 ? "out-of-stock" : "in-stock";
  }

  if (availability.includes("out of stock") || availability.includes("out-of-stock")) {
    return "out-of-stock";
  }
  return "in-stock";
}

export function getStockLabel(
  product: Pick<Product, "stock" | "availability" | "category" | "fabric">
): string {
  const status = getStockStatus(product);
  if (status === "out-of-stock") return "Out of Stock";
  // In-stock items show their stitched/unstitched classification instead
  // of a generic count. Left blank until the product is classified.
  return getStitchLabel(product.category, product.fabric);
}

/**
 * "Stitched" / "Unstitched" based on the category or fabric text
 * mentioning it, or "" when neither has been classified yet.
 */
export function getStitchLabel(category?: string, fabric?: string): string {
  const haystack = `${category ?? ""} ${fabric ?? ""}`.toLowerCase();
  if (haystack.includes("unstitch")) return "Unstitched";
  if (haystack.includes("stitch")) return "Stitched";
  return "";
}

/**
 * Discount percentage, or null when there's no real discount to show
 * (price >= mrp) so callers can skip rendering a "0% OFF" badge.
 */
export function getDiscountPercent(product: Pick<Product, "price" | "mrp">): number | null {
  if (!product.mrp || product.mrp <= product.price) return null;
  const percent = Math.round((1 - product.price / product.mrp) * 100);
  return percent > 0 ? percent : null;
}
