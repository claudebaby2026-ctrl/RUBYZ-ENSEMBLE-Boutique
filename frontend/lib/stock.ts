import type { Product } from "@/lib/content";

// Below this many units left (and still > 0), we surface "Only N left"
// urgency messaging instead of the plain "In stock" label.
const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = "out-of-stock" | "low-stock" | "in-stock";

/**
 * Single source of truth for "is this product actually purchasable / how
 * urgently should we say so" — derived primarily from the numeric
 * `stock` count (when the backend provides one), falling back to the
 * free-text `availability` string for older/seed data that predates
 * per-product stock counts.
 */
export function getStockStatus(product: Pick<Product, "stock" | "availability">): StockStatus {
  const stock = product.stock;
  const availability = (product.availability ?? "").toLowerCase();

  if (typeof stock === "number") {
    if (stock <= 0) return "out-of-stock";
    if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
    return "in-stock";
  }

  if (availability.includes("out of stock") || availability.includes("out-of-stock")) {
    return "out-of-stock";
  }
  if (availability.includes("low") || availability.includes("limited")) {
    return "low-stock";
  }
  return "in-stock";
}

export function getStockLabel(product: Pick<Product, "stock" | "availability">): string {
  const status = getStockStatus(product);
  if (status === "out-of-stock") return "Out of Stock";
  if (status === "low-stock") {
    if (typeof product.stock === "number" && product.stock > 0) {
      return `Only ${product.stock} left`;
    }
    return product.availability || "Low Stock";
  }
  return product.availability || "In Stock";
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
