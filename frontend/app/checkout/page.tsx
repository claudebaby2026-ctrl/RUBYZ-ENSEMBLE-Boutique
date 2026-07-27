"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { getCartDeliveryFee, getAutoDiscount } from "@/lib/cart";
import { brand } from "@/lib/content";

const MODE_KEY = "rubyz_delivery_mode";

// No account required to check out — everyone can send an order request
// straight to WhatsApp, where the team confirms details directly with the
// customer, so there's no name/phone/email/address form to fill in here.
export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, clearCart } = useCart();
  const [mode, setMode] = useState<"Delivery" | "Pickup">("Delivery");
  const [sent, setSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY);
    if (stored === "Delivery" || stored === "Pickup") setMode(stored);
  }, []);

  useEffect(() => {
    // Nothing left to check out — bounce back to the cart, unless we just
    // sent the order to WhatsApp (in which case the cart has been
    // intentionally cleared).
    if (hydrated && items.length === 0 && !sent) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, sent, router]);

  // No live courier-rate lookup anymore — the owner confirms delivery
  // details directly over WhatsApp, so this is just the flat per-suit
  // estimate (₹100/suit) shown up front for the customer's reference.
  const deliveryFee = mode === "Delivery" ? getCartDeliveryFee(items) : 0;
  // Automatic 10% storewide discount — the only discount applied at
  // checkout now that coupon codes have been removed. Never applies to
  // the delivery fee.
  const autoDiscount = getAutoDiscount(subtotal);
  const discount = autoDiscount;
  const total = subtotal - discount + deliveryFee;

  const valid = agreedToTerms;

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
    if (autoDiscount > 0) lines.push(`Discount (10%): −₹${autoDiscount.toLocaleString()}`);
    lines.push(`${mode === "Delivery" ? `Delivery: ₹${deliveryFee}` : "Pickup: in-store"}`);
    lines.push(`Estimated total: ₹${total.toLocaleString()}`);
    lines.push("");
    lines.push(mode === "Delivery" ? "Mode: Delivery — I'll share my name, phone and address here." : "Mode: Store pickup");
    return lines.join("\n");
  };

  const sendToWhatsApp = () => {
    if (!valid) return;
    const url = `https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    clearCart();
    setSent(true);
  };

  if (!hydrated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FDF2EC]">
        <div className="flex items-center gap-2 text-sm text-[#8B7A6E]">
          <Loader2 size={16} className="animate-spin" /> Loading checkout…
        </div>
      </main>
    );
  }

  if (sent) {
    return (
      <main className="bg-[#FDF2EC]">
        <section className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-8">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-[#3A9D5D]" />
          <h1 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>Sent to WhatsApp</h1>
          <p className="mt-3 text-sm text-[#7A6D65]">
            We&apos;ve opened WhatsApp with your order details. Please send the message so our team can confirm
            availability and pricing with you directly — nothing has been charged yet.
          </p>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#3A2213] px-6 py-3 text-sm text-white">
            Continue Shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#FDF2EC]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm">
            <h1 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>Checkout</h1>
            <p className="mt-2 text-sm text-[#8B7A6E]">
              We don&apos;t take payment on the site — choose delivery or pickup below and we&apos;ll send your
              order to WhatsApp. Share your name, phone and address there and our team will confirm availability
              and pricing with you directly.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("Delivery")}
                  className={`rounded-full px-5 py-3 text-sm ${mode === "Delivery" ? "bg-[#3A2213] text-white" : "border border-[#3A2213]/12"}`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setMode("Pickup")}
                  className={`rounded-full px-5 py-3 text-sm ${mode === "Pickup" ? "bg-[#3A2213] text-white" : "border border-[#3A2213]/12"}`}
                >
                  Pickup
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm">
            <h2 className="text-2xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-[#7A6D65]">
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
              {autoDiscount > 0 && (
                <div className="flex justify-between text-[#B17F5E]">
                  <span>Discount (10%)</span>
                  <span>−₹{autoDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-[#3A2213]/8 pt-3 text-base font-semibold text-[#3A2213]"><span>Estimated Total</span><span>₹{total.toLocaleString()}</span></div>
              <p className="text-xs text-[#A8968A]">Final pricing and delivery is confirmed by our team over WhatsApp.</p>
            </div>

            <label className="mt-6 flex items-start gap-3 text-xs leading-5 text-[#7A6D65]">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 accent-[#3A2213]"
              />
              <span>
                I have read, understood and agree to the{" "}
                <Link href="/terms-and-conditions" target="_blank" className="underline hover:text-[#3A2213]">
                  Terms &amp; Conditions
                </Link>
                ,{" "}
                <Link href="/shipping-policy" target="_blank" className="underline hover:text-[#3A2213]">
                  Shipping Policy
                </Link>
                ,{" "}
                <Link href="/refund-policy" target="_blank" className="underline hover:text-[#3A2213]">
                  Cancellation &amp; Refund Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" target="_blank" className="underline hover:text-[#3A2213]">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              onClick={sendToWhatsApp}
              disabled={!valid}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Order via WhatsApp
            </button>
            {!valid && (
              <p className="mt-3 text-center text-xs text-[#A8968A]">
                Please agree to the Terms &amp; Conditions and related policies to continue.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
