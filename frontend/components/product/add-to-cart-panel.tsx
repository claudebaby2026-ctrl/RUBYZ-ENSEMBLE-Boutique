"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, MessageCircle, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/content";
import { brand } from "@/lib/content";
import { useCart } from "@/lib/useCart";

export function AddToCartPanel({ product, image }: { product: Product; image?: string }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const sizes = product.sizes?.length ? product.sizes : ["Free Size"];
  const [size, setSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = (product.stock ?? 1) <= 0;

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
      quantity,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div>
      {sizes.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  size === s ? "border-[#111111] bg-[#111111] text-white" : "border-black/10 text-[#111111]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Quantity</p>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="rounded-full border border-black/10 p-2.5"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(q + 1, product.stock ?? 99))}
            className="rounded-full border border-black/10 p-2.5"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? <Check size={16} /> : <ShoppingBag size={16} />}
          {outOfStock ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
        </button>
        <a
          href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (₹${product.price}).`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-medium text-[#111111]"
        >
          <MessageCircle size={16} /> WhatsApp Enquiry
        </a>
      </div>

      {added && (
        <div className="mt-4 flex items-center gap-3 rounded-[1rem] bg-[#F8F5F1] p-3 text-sm text-[#111111]">
          <span>Added to your cart.</span>
          <Link href="/cart" onClick={() => router.refresh()} className="font-medium text-[#B68D40] underline">
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
}
