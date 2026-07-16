"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/lib/content";
import { resolveImageUrl } from "@/lib/api";

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
  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-[1.5rem] border border-black/5 bg-white p-3 shadow-[0_12px_40px_rgba(17,17,17,0.04)]"
    >
      <div className="relative overflow-hidden rounded-[1.2rem] bg-[#F8F5F1] p-4">
        <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm">
          <Heart size={15} className="text-[#111111]" />
        </div>
        {image ? (
          <img src={image} alt={product.name} className="h-64 w-full rounded-[1rem] object-cover" />
        ) : (
          <div className="h-64 rounded-[1rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
        )}        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
            {product.badge}
          </span>
          <span className="text-[11px] uppercase tracking-[0.24em] text-[#B68D40]">{product.availability}</span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#B68D40]">RUBYZ Ensemble</p>
        <Link href={`/products/${product.slug}`} className="mt-2 block text-lg text-[#111111] hover:text-[#B68D40]">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-gray-500">({product.sold})</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="font-semibold text-[#111111]">₹{product.price}</span>
          <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
          <span className="text-xs text-[#D94F70]">{Math.round((1 - product.price / product.mrp) * 100)}% OFF</span>
        </div>
      </div>
    </motion.article>
  );
}
