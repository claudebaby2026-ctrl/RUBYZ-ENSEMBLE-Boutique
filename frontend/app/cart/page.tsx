"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";
import { DELIVERY_FEE } from "@/lib/cart";
import { useRouter } from "next/navigation";

const MODE_KEY = "rubyz_delivery_mode";

export default function CartPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, updateQuantity, removeFromCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"Delivery" | "Pickup">(() => {
    if (typeof window === "undefined") return "Delivery";
    return (window.localStorage.getItem(MODE_KEY) as "Delivery" | "Pickup") || "Delivery";
  });

  const setDeliveryMode = (next: "Delivery" | "Pickup") => {
    setMode(next);
    window.localStorage.setItem(MODE_KEY, next);
  };

  const deliveryFee = mode === "Delivery" && items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  if (!hydrated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FBFAF8]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading your cart…
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Your Cart</h1>

            {items.length === 0 ? (
              <div className="mt-10 flex flex-col items-center gap-4 py-10 text-center">
                <ShoppingBag size={36} className="text-[#B68D40]" />
                <p className="text-sm text-gray-500">Your cart is empty.</p>
                <Link href="/collections" className="rounded-full bg-[#111111] px-6 py-3 text-sm text-white">
                  Browse Collections
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex flex-col gap-3 rounded-[1.2rem] border border-black/5 bg-[#F8F5F1] p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-20 w-16 shrink-0 rounded-[0.8rem] object-cover" />
                      ) : (
                        <div className="h-20 w-16 shrink-0 rounded-[0.8rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${item.slug}`} className="font-medium text-[#111111] hover:text-[#B68D40]">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">Size: {item.size}</p>
                        <p className="mt-1 text-sm text-gray-600">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="rounded-full border border-black/10 p-2.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="rounded-full border border-black/10 p-2.5"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size)}
                        className="rounded-full border border-black/10 p-2.5 text-[#D94F70]"
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

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? `₹${deliveryFee}` : "Free"}</span></div>
              <div className="mt-3 border-t border-black/5 pt-3 flex justify-between text-base font-semibold text-[#111111]"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>
            <div className="mt-6 rounded-[1.2rem] bg-[#F8F5F1] p-4 text-sm">
              <p className="font-semibold text-[#111111]">Pickup or Delivery</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setDeliveryMode("Delivery")}
                  className={`rounded-full px-4 py-2 ${mode === "Delivery" ? "bg-[#111111] text-white" : "border border-black/10"}`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setDeliveryMode("Pickup")}
                  className={`rounded-full px-4 py-2 ${mode === "Pickup" ? "bg-[#111111] text-white" : "border border-black/10"}`}
                >
                  Pickup
                </button>
              </div>
            </div>
            <button
              disabled={items.length === 0 || authLoading}
              onClick={() => router.push(user ? "/checkout" : "/login?redirect=/checkout")}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {user ? "Proceed to Checkout" : "Sign In to Checkout"} <ArrowRight size={16} />
            </button>
            {!authLoading && !user && items.length > 0 && (
              <p className="mt-3 text-center text-xs text-gray-400">
                You&apos;ll need an account to place an order.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}