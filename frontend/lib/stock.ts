import type { Product } from "@/lib/content";
import { isUnstitchedProduct } from "@/lib/tailoring";

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
  // In-stock items show their unstitched/ready-made classification
  // instead of a generic count.
  return getStitchLabel(product.category, product.fabric);
}

/**
 * "Unstitched" / "Ready-made" classification for a product card. Uses the
 * same category/fabric-text check as the unstitched tailoring notice
 * (isUnstitchedProduct) so the two stay in sync — anything not flagged as
 * unstitched is shown as "Ready-made" rather than left blank.
 */
export function getStitchLabel(category?: string, fabric?: string): string {
  return isUnstitchedProduct(category, fabric) ? "Unstitched" : "Ready-made";
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
