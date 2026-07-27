import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/content";
import { resolveImageUrl } from "@/lib/api";
import { LikeButton } from "@/components/product/like-button";
import { OutOfStockRibbon, StockBadge } from "@/components/product/stock-badge";
import { getDiscountPercent, getStockStatus } from "@/lib/stock";

export function ProductCard({ product }: { product: Product }) {
  const image = resolveImageUrl(product.images?.[0]);
  const outOfStock = getStockStatus(product) === "out-of-stock";
  const discount = getDiscountPercent(product);
  return (
    <Link href={`/products/${product.slug}`} className="block">
      <motion.article
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="group overflow-hidden rounded-[1.5rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-3 shadow-[0_12px_40px_rgba(17,17,17,0.04)]"
      >
        <div className="relative overflow-hidden rounded-[1.2rem] bg-[#E9CFBA] p-4">
          <OutOfStockRibbon product={product} />
          <div className="absolute right-3 top-3">
            <LikeButton productId={product.id} />
          </div>
          {image ? (
            <img
              src={image}
              alt={product.name}
              className={`h-64 w-full rounded-[1rem] object-cover ${outOfStock ? "grayscale-[70%] opacity-70" : ""}`}
            />
          ) : (
            <div className="h-64 rounded-[1rem] bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)]" />
          )}        <div className="mt-3 flex items-center justify-between">
            <span className="rounded-full bg-[#3A2213] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
              {product.badge}
            </span>
            <StockBadge product={product} className="text-[11px] uppercase tracking-[0.24em]" />
          </div>
        </div>

        <div className="px-2 pb-2 pt-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#B17F5E]">RUBYZ Ensemble</p>
          <span className="mt-2 block text-lg text-[#3A2213] group-hover:text-[#B17F5E]">
            {product.name}
          </span>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#3A2213]">₹{product.price}</span>
            <span className="text-xs text-[#A8968A] line-through">₹{product.mrp}</span>
            {discount !== null && <span className="text-xs text-[#D94F70]">{discount}% OFF</span>}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
