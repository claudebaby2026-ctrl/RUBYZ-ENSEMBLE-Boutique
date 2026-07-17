"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";
import { DELIVERY_FEE } from "@/lib/cart";
import { createOrder } from "@/lib/api";

const MODE_KEY = "rubyz_delivery_mode";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"Delivery" | "Pickup">("Delivery");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY);
    if (stored === "Delivery" || stored === "Pickup") setMode(stored);
  }, []);

  useEffect(() => {
    // Checkout requires an account — bounce to login and send the customer
    // straight back here once they've signed in.
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    // Pre-fill from the signed-in account so returning customers don't have
    // to retype their details.
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    // Nothing left to check out — bounce back to the cart, unless we just
    // placed an order (in which case the cart has been intentionally cleared).
    if (hydrated && items.length === 0 && !orderId) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, orderId, router]);

  const deliveryFee = mode === "Delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const valid = form.name.trim().length > 1 && form.phone.trim().length >= 8 && (mode === "Pickup" || form.address.trim().length > 4);

  // This calls the real order-creation endpoint (POST /orders) so every part
  // of checkout except the actual payment gateway is fully wired up. Swap
  // the block below for a Razorpay `checkout.js` order + payment flow when
  // that integration is ready — on success, call the same createOrder logic
  // (or confirm the pending order) before clearing the cart.
  const placeOrder = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        customerName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: mode === "Delivery" ? form.address : "Store pickup",
        mode,
        items: items.map((item) => ({
          productId: item.productId,
          name: `${item.name} (${item.size})`,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
      });
      setOrderId(order.id);
      clearCart();
    } catch (e: any) {
      setError(e?.message || "Could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || authLoading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FBFAF8]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading checkout…
        </div>
      </main>
    );
  }

  if (orderId) {
    return (
      <main className="bg-[#FBFAF8]">
        <section className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-8">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-[#3A9D5D]" />
          <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Order Confirmed</h1>
          <p className="mt-3 text-sm text-gray-600">
            Your order <strong>{orderId}</strong> has been placed. Our team will reach out on {form.phone} to confirm {mode.toLowerCase()}.
          </p>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm text-white">
            Continue Shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Checkout</h1>
            <div className="mt-6 space-y-4">
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
              />
              <input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
              />
              <input
                placeholder="Email address (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
              />
              {mode === "Delivery" && (
                <textarea
                  placeholder="Delivery address"
                  rows={4}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("Delivery")}
                  className={`rounded-full px-5 py-3 text-sm ${mode === "Delivery" ? "bg-[#111111] text-white" : "border border-black/10"}`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setMode("Pickup")}
                  className={`rounded-full px-5 py-3 text-sm ${mode === "Pickup" ? "bg-[#111111] text-white" : "border border-black/10"}`}
                >
                  Pickup
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                  <span>{item.name} ({item.size}) x{item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? `₹${deliveryFee}` : "Free"}</span></div>
              <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-semibold text-[#111111]"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>
            {error && <p className="mt-4 text-sm text-[#D94F70]">{error}</p>}
            <button
              onClick={placeOrder}
              disabled={!valid || submitting}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#B68D40] px-6 py-3 text-sm font-medium text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Placing Order…" : "Pay via Razorpay"}
            </button>
            {!valid && (
              <p className="mt-3 text-center text-xs text-gray-400">
                Fill in your name, phone{mode === "Delivery" ? " and address" : ""} to continue.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}