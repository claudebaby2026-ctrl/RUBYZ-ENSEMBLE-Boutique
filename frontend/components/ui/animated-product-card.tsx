"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/content";
import { resolveImageUrl } from "@/lib/api";
import { LikeButton } from "@/components/product/like-button";
import { OutOfStockRibbon, StockBadge } from "@/components/product/stock-badge";
import { getDiscountPercent, getStockStatus } from "@/lib/stock";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          className={index < Math.round(rating) ? "fill-[#B68D40] text-[#B68D40]" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export function AnimatedProductCard({ product }: { product: Product }) {
  const image = resolveImageUrl(product.images?.[0]);
  const outOfStock = getStockStatus(product) === "out-of-stock";
  const discount = getDiscountPercent(product);
  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-[1.2rem] border border-black/5 bg-white p-2 shadow-[0_12px_40px_rgba(17,17,17,0.04)] sm:rounded-[1.5rem] sm:p-3"
    >
      <div className="relative overflow-hidden rounded-[1rem] bg-[#F8F5F1] p-2 sm:rounded-[1.2rem] sm:p-4">
        <OutOfStockRibbon product={product} />
        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
          <LikeButton productId={product.id} />
        </div>
        {image ? (
          <img
            src={image}
            alt={product.name}
            className={`aspect-[3/4] w-full rounded-[0.8rem] object-cover sm:rounded-[1rem] ${outOfStock ? "grayscale-[70%] opacity-70" : ""}`}
          />
        ) : (
          <div className="aspect-[3/4] w-full rounded-[0.8rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)] sm:rounded-[1rem]" />
        )}
        <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
          <span className="rounded-full bg-[#111111] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white sm:px-2.5 sm:text-[10px] sm:tracking-[0.24em]">
            {product.badge}
          </span>
          <StockBadge product={product} className="truncate text-[9px] uppercase tracking-[0.2em] sm:text-[11px] sm:tracking-[0.24em]" />
        </div>
      </div>

      <div className="px-1.5 pb-1.5 pt-3 sm:px-2 sm:pb-2 sm:pt-4">
        <p className="text-[9px] uppercase tracking-[0.24em] text-[#B68D40] sm:text-[11px] sm:tracking-[0.3em]">RUBYZ Ensemble</p>
        <Link href={`/products/${product.slug}`} className="mt-1.5 block truncate text-sm text-[#111111] hover:text-[#B68D40] sm:mt-2 sm:text-lg">
          {product.name}
        </Link>
        <div className="mt-1.5 flex items-center gap-2 sm:mt-2">
          <Stars rating={product.rating} />
          <span className="text-[11px] text-gray-500 sm:text-xs">({product.sold})</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs sm:mt-3 sm:gap-2 sm:text-sm">
          <span className="font-semibold text-[#111111]">₹{product.price}</span>
          <span className="text-[11px] text-gray-400 line-through sm:text-xs">₹{product.mrp}</span>
          {discount !== null && <span className="text-[11px] text-[#D94F70] sm:text-xs">{discount}% OFF</span>}
        </div>
      </div>
    </motion.article>
  );
}
