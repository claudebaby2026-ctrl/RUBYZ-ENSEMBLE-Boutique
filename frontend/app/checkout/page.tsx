"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertTriangle, Tag, X } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";
import { DELIVERY_FEE } from "@/lib/cart";
import { createOrder, createRazorpayOrder, getShippingRate, validateCoupon, ApiError, type Coupon } from "@/lib/api";

const MODE_KEY = "rubyz_delivery_mode";

// Minimal shape of the `window.Razorpay` constructor injected by
// https://checkout.razorpay.com/v1/checkout.js — the full type is much
// bigger, this just covers what we use below.
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"Delivery" | "Pickup">("Delivery");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", pincode: "", city: "", state: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStockError, setIsStockError] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  // Live courier rate for the current pincode, replacing the flat
  // DELIVERY_FEE when Shiprocket has one. `null` means "not fetched yet /
  // fell back" — the flat fee is used in that case, silently (no error
  // shown to the customer; see the effect below).
  const [liveRate, setLiveRate] = useState<{ fee: number; courierName?: string | null } | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

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

  const pincodeValid = /^\d{6}$/.test(form.pincode.trim());

  // Debounced live rate lookup: whenever the pincode looks complete (and
  // we're in Delivery mode with items in the cart), ask the backend for a
  // real courier rate. This must never block or error out checkout — on
  // any failure we simply keep using the flat DELIVERY_FEE, silently.
  useEffect(() => {
    if (mode !== "Delivery" || !pincodeValid || items.length === 0) {
      setLiveRate(null);
      return;
    }
    let cancelled = false;
    setRateLoading(true);
    const timer = setTimeout(() => {
      getShippingRate({
        pincode: form.pincode.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          category: item.category || "",
          quantity: item.quantity,
        })),
      })
        .then((quote) => {
          if (cancelled) return;
          setLiveRate(quote.live ? { fee: quote.fee, courierName: quote.courierName } : null);
        })
        .catch(() => {
          // Silent fallback — the flat fee below already covers this case.
          if (!cancelled) setLiveRate(null);
        })
        .finally(() => {
          if (!cancelled) setRateLoading(false);
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, pincodeValid, form.pincode, items]);

  const deliveryFee = mode === "Delivery" ? (liveRate?.fee ?? DELIVERY_FEE) : 0;
  const discount = appliedCoupon
    ? Math.min(
        appliedCoupon.discount_type === "flat"
          ? appliedCoupon.discount_value
          : Math.floor((subtotal * appliedCoupon.discount_value) / 100),
        subtotal
      )
    : 0;
  const total = subtotal - discount + deliveryFee;

  const valid =
    form.name.trim().length > 1 &&
    form.phone.trim().length >= 8 &&
    (mode === "Pickup" || (form.address.trim().length > 4 && pincodeValid));

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || couponLoading) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const coupon = await validateCoupon(code);
      setAppliedCoupon(coupon);
    } catch (e: any) {
      setAppliedCoupon(null);
      setCouponError(e?.message || "Could not apply this coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const orderItemsPayload = () =>
    items.map((item) => ({
      productId: item.productId,
      name: `${item.name} (${item.size})`,
      quantity: item.quantity,
      price: item.price,
    }));

  // Two-step Razorpay flow:
  //  1. Ask the backend to price this cart from the DB and open a
  //     matching Razorpay order (POST /payments/create-razorpay-order).
  //  2. Launch the Razorpay checkout modal for that order. Only once the
  //     customer actually completes payment does its `handler` callback
  //     fire — at which point we call POST /orders with the payment proof
  //     (order id, payment id, signature), which the backend verifies
  //     server-side before creating the order and decrementing stock.
  const placeOrder = async () => {
    if (!valid || submitting) return;
    if (!window.Razorpay) {
      setError("Payment gateway is still loading — please try again in a moment.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setIsStockError(false);
    try {
      const rpOrder = await createRazorpayOrder({
        mode,
        items: orderItemsPayload(),
        couponCode: appliedCoupon?.code,
      });

      const rzp = new window.Razorpay({
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        order_id: rpOrder.razorpayOrderId,
        name: "RUBYZ Ensemble",
        description: "Order payment",
        prefill: {
          name: form.name,
          email: form.email || undefined,
          contact: form.phone,
        },
        theme: { color: "#B68D40" },
        handler: async (response: any) => {
          try {
            const order = await createOrder({
              customerName: form.name,
              phone: form.phone,
              email: form.email || undefined,
              address: mode === "Delivery" ? form.address : "Store pickup",
              pincode: mode === "Delivery" ? form.pincode.trim() : undefined,
              city: mode === "Delivery" ? form.city.trim() || undefined : undefined,
              state: mode === "Delivery" ? form.state.trim() || undefined : undefined,
              mode,
              items: orderItemsPayload(),
              total,
              // The server never trusts this total/discount — it only
              // reads the code and re-validates + recomputes the discount
              // itself (see POST /orders). This is purely what the
              // customer already saw.
              couponCode: appliedCoupon?.code,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setOrderId(order.id);
            clearCart();
          } catch (e: any) {
            // A 400 here means the server rejected the order after
            // re-checking stock/prices (or the coupon) against the DB —
            // most commonly because someone else bought the last unit, or
            // the coupon expired / hit its usage limit, while checkout was
            // open. Payment was already captured by Razorpay in this case;
            // it will be auto-refunded, and the message says so.
            setIsStockError(e instanceof ApiError && e.status === 400);
            setError(e?.message || "Could not confirm your order. Please contact us if you were charged.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          // Customer closed the checkout modal without paying — just
          // reset the button, nothing was charged or created.
          ondismiss: () => setSubmitting(false),
        },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again or use a different payment method.");
        setSubmitting(false);
      });

      rzp.open();
    } catch (e: any) {
      setIsStockError(e instanceof ApiError && e.status === 400);
      setError(e?.message || "Could not start payment. Please try again.");
      setSubmitting(false);
    }
  };

  if (!hydrated || authLoading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FBFAF8]">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
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
                <>
                  <textarea
                    placeholder="Delivery address"
                    rows={4}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      placeholder="Pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                      className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
                    />
                    <input
                      placeholder="City (optional)"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
                    />
                    <input
                      placeholder="State (optional)"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full rounded-[1rem] border border-black/10 px-4 py-3"
                    />
                  </div>
                  {form.pincode.length > 0 && !pincodeValid && (
                    <p className="text-xs text-[#D94F70]">Enter a valid 6-digit pincode.</p>
                  )}
                </>
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
              <div className="flex justify-between">
                <span>
                  Delivery
                  {mode === "Delivery" && rateLoading && (
                    <Loader2 size={11} className="ml-1.5 inline animate-spin align-middle text-gray-400" />
                  )}
                  {liveRate?.courierName && (
                    <span className="ml-1.5 text-xs text-gray-400">via {liveRate.courierName}</span>
                  )}
                </span>
                <span>{deliveryFee ? `₹${deliveryFee}` : "Free"}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#3A9D5D]">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>−₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-semibold text-[#111111]"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>

            <div className="mt-6">
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#3A9D5D]/30 bg-[#3A9D5D]/5 px-4 py-3 text-sm text-[#111111]">
                  <span className="flex items-center gap-2">
                    <Tag size={14} className="text-[#3A9D5D]" />
                    <strong className="tracking-[0.08em]">{appliedCoupon.code}</strong> applied
                  </span>
                  <button onClick={removeCoupon} className="rounded-full p-1 text-gray-500 hover:text-[#D94F70]" aria-label="Remove coupon">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                    className="flex-1 rounded-[1rem] border border-black/10 px-4 py-2.5 text-sm uppercase"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={!couponInput.trim() || couponLoading}
                    className="flex items-center gap-2 whitespace-nowrap rounded-[1rem] border border-[#111111] px-4 py-2.5 text-sm font-medium text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading && <Loader2 size={14} className="animate-spin" />}
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="mt-2 text-xs text-[#D94F70]">{couponError}</p>}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#D94F70]/20 bg-[#D94F70]/5 p-4 text-sm text-[#D94F70]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p>{error}</p>
                  {isStockError && (
                    <Link href="/cart" className="mt-1 inline-block font-medium underline underline-offset-2">
                      Back to cart to adjust quantities
                    </Link>
                  )}
                </div>
              </div>
            )}
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
                Fill in your name, phone{mode === "Delivery" ? ", address and a valid pincode" : ""} to continue.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}