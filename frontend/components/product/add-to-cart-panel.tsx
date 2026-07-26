"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "@/lib/content";
import { brand } from "@/lib/content";
import { useCart } from "@/lib/useCart";

export function AddToCartPanel({ product, image }: { product: Product; image?: string }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const sizes = product.sizes?.length ? product.sizes : ["Free Size"];
  const [size, setSize] = useState(sizes[0]);
  const [added, setAdded] = useState(false);
  const outOfStock = (product.stock ?? 1) <= 0;

  // RUBYZ keeps exactly one piece per suit — there's no quantity to pick,
  // every add-to-cart is a single, exclusive unit.
  const handleAdd = () => {
    if (outOfStock) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image,
      price: product.price,
      mrp: product.mrp,
      size,
      stock: product.stock,
      quantity: 1,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div>
      {sizes.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[#A8968A]">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  size === s ? "border-[#3A2213] bg-[#3A2213] text-white" : "border-[#3A2213]/12 text-[#3A2213]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {!outOfStock && (
        <p className="mt-6 flex items-center gap-2 text-sm font-medium text-[#B17F5E]">
          <Sparkles size={14} /> Only 1 piece available — this exact suit won&apos;t be restocked.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="inline-flex items-center gap-2 rounded-full bg-[#3A2213] px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? <Check size={16} /> : <ShoppingBag size={16} />}
          {outOfStock ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
        </button>
        <a
          href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (₹${product.price}).`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#3A2213]/12 px-6 py-3 text-sm font-medium text-[#3A2213]"
        >
          <MessageCircle size={16} /> WhatsApp Enquiry
        </a>
      </div>

      {added && (
        <div className="mt-4 flex items-center gap-3 rounded-[1rem] bg-[#E9CFBA] p-3 text-sm text-[#3A2213]">
          <span>Added to your cart.</span>
          <Link href="/cart" onClick={() => router.refresh()} className="font-medium text-[#B17F5E] underline">
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
}
