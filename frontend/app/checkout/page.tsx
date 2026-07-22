"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Tag, X } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";
import { DELIVERY_FEE } from "@/lib/cart";
import { brand } from "@/lib/content";
import { validateCoupon, type Coupon } from "@/lib/api";

const MODE_KEY = "rubyz_delivery_mode";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"Delivery" | "Pickup">("Delivery");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", pincode: "", city: "", state: "" });
  const [sent, setSent] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

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
    // sent the order to WhatsApp (in which case the cart has been
    // intentionally cleared).
    if (hydrated && items.length === 0 && !sent) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, sent, router]);

  const pincodeValid = /^\d{6}$/.test(form.pincode.trim());

  // No live courier-rate lookup anymore — the owner confirms delivery
  // details directly over WhatsApp, so this is just the flat estimate
  // shown up front for the customer's reference.
  const deliveryFee = mode === "Delivery" ? DELIVERY_FEE : 0;
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
    } catch (e) {
      setAppliedCoupon(null);
      setCouponError(e instanceof Error ? e.message : "Could not apply this coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  // Builds the itemized order summary the owner sees in WhatsApp — this is
  // a request for the owner to confirm (nothing is charged, reserved, or
  // written to the database yet). The owner checks real stock and, once
  // confirmed with the customer, logs it from the dashboard's Orders tab,
  // which is what actually decrements stock.
  const buildWhatsAppMessage = () => {
    const lines = [
      `Hi! I'd like to place an order from ${brand.name}.`,
      "",
      ...items.map((item) => `• ${item.name} (${item.size}) x${item.quantity} — ₹${item.price * item.quantity}`),
      "",
      `Subtotal: ₹${subtotal.toLocaleString()}`,
    ];
    if (appliedCoupon) lines.push(`Coupon (${appliedCoupon.code}): −₹${discount.toLocaleString()}`);
    lines.push(`${mode === "Delivery" ? `Delivery: ₹${deliveryFee}` : "Pickup: in-store"}`);
    lines.push(`Estimated total: ₹${total.toLocaleString()}`);
    lines.push("");
    lines.push(`Name: ${form.name}`);
    lines.push(`Phone: ${form.phone}`);
    if (form.email) lines.push(`Email: ${form.email}`);
    if (mode === "Delivery") {
      lines.push(`Delivery address: ${form.address}, ${form.city ? `${form.city}, ` : ""}${form.state ? `${form.state} ` : ""}${form.pincode}`.trim());
    } else {
      lines.push("Mode: Store pickup");
    }
    return lines.join("\n");
  };

  const sendToWhatsApp = () => {
    if (!valid) return;
    const url = `https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    clearCart();
    setSent(true);
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

  if (sent) {
    return (
      <main className="bg-[#FBFAF8]">
        <section className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-8">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-[#3A9D5D]" />
          <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Sent to WhatsApp</h1>
          <p className="mt-3 text-sm text-gray-600">
            We&apos;ve opened WhatsApp with your order details. Please send the message so our team can confirm
            availability and pricing with you directly — nothing has been charged yet.
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
            <p className="mt-2 text-sm text-gray-500">
              We don&apos;t take payment on the site — fill in your details below and we&apos;ll send your order
              to WhatsApp, where our team confirms availability and pricing with you directly.
            </p>
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
                <span>Delivery</span>
                <span>{deliveryFee ? `₹${deliveryFee}` : "Free"}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#3A9D5D]">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>−₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-semibold text-[#111111]"><span>Estimated Total</span><span>₹{total.toLocaleString()}</span></div>
              <p className="text-xs text-gray-400">Final pricing and delivery is confirmed by our team over WhatsApp.</p>
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

            <button
              onClick={sendToWhatsApp}
              disabled={!valid}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Order via WhatsApp
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
