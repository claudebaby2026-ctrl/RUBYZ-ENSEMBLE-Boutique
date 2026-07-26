"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { getCartDeliveryFee } from "@/lib/cart";
import { useRouter } from "next/navigation";

const MODE_KEY = "rubyz_delivery_mode";

export default function CartPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, removeFromCart } = useCart();
  const [mode, setMode] = useState<"Delivery" | "Pickup">(() => {
    if (typeof window === "undefined") return "Delivery";
    return (window.localStorage.getItem(MODE_KEY) as "Delivery" | "Pickup") || "Delivery";
  });

  const setDeliveryMode = (next: "Delivery" | "Pickup") => {
    setMode(next);
    window.localStorage.setItem(MODE_KEY, next);
  };

  const deliveryFee = mode === "Delivery" && items.length > 0 ? getCartDeliveryFee(items) : 0;
  const total = subtotal + deliveryFee;

  if (!hydrated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FDF2EC]">
        <div className="flex items-center gap-2 text-sm text-[#8B7A6E]">
          <Loader2 size={16} className="animate-spin" /> Loading your cart…
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#FDF2EC]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm">
            <h1 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>Your Cart</h1>

            {items.length === 0 ? (
              <div className="mt-10 flex flex-col items-center gap-4 py-10 text-center">
                <ShoppingBag size={36} className="text-[#B17F5E]" />
                <p className="text-sm text-[#8B7A6E]">Your cart is empty.</p>
                <Link href="/collections" className="rounded-full bg-[#3A2213] px-6 py-3 text-sm text-white">
                  Browse Collections
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex flex-col gap-3 rounded-[1.2rem] border border-[#3A2213]/8 bg-[#E9CFBA] p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-20 w-16 shrink-0 rounded-[0.8rem] object-cover" />
                      ) : (
                        <div className="h-20 w-16 shrink-0 rounded-[0.8rem] bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${item.slug}`} className="font-medium text-[#3A2213] hover:text-[#B17F5E]">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-[#8B7A6E]">Size: {item.size}</p>
                        <p className="mt-1 text-sm text-[#7A6D65]">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
                      <span className="text-xs uppercase tracking-[0.2em] text-[#A8968A]">1 piece</span>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size)}
                        className="rounded-full border border-[#3A2213]/12 p-2.5 text-[#D94F70]"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm">
            <h2 className="text-2xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-[#7A6D65]">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? `₹${deliveryFee}` : "Free"}</span></div>
              <div className="mt-3 border-t border-[#3A2213]/8 pt-3 flex justify-between text-base font-semibold text-[#3A2213]"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>
            <div className="mt-6 rounded-[1.2rem] bg-[#E9CFBA] p-4 text-sm">
              <p className="font-semibold text-[#3A2213]">Pickup or Delivery</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setDeliveryMode("Delivery")}
                  className={`rounded-full px-4 py-2 ${mode === "Delivery" ? "bg-[#3A2213] text-white" : "border border-[#3A2213]/12"}`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setDeliveryMode("Pickup")}
                  className={`rounded-full px-4 py-2 ${mode === "Pickup" ? "bg-[#3A2213] text-white" : "border border-[#3A2213]/12"}`}
                >
                  Pickup
                </button>
              </div>
            </div>
            <button
              disabled={items.length === 0}
              onClick={() => router.push("/checkout")}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3A2213] px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}