import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Checkout",
  description: "Guest checkout experience with pickup and delivery options.",
};

export default function CheckoutPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Guest Checkout</h1>
            <div className="mt-6 space-y-4">
              <input placeholder="Full name" className="w-full rounded-[1rem] border border-black/10 px-4 py-3" />
              <input placeholder="Phone number" className="w-full rounded-[1rem] border border-black/10 px-4 py-3" />
              <input placeholder="Email address" className="w-full rounded-[1rem] border border-black/10 px-4 py-3" />
              <textarea placeholder="Delivery address or pickup note" rows={4} className="w-full rounded-[1rem] border border-black/10 px-4 py-3" />
              <div className="flex gap-3">
                <button className="rounded-full bg-[#111111] px-5 py-3 text-sm text-white">Delivery</button>
                <button className="rounded-full border border-black/10 px-5 py-3 text-sm">Pickup</button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>Rose Anarkali</span><span>₹3,499</span></div>
              <div className="flex justify-between"><span>Co-ord Set</span><span>₹1,899</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>₹150</span></div>
              <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-semibold text-[#111111]"><span>Total</span><span>₹5,548</span></div>
            </div>
            <button className="mt-8 w-full rounded-full bg-[#B68D40] px-6 py-3 text-sm font-medium text-[#111111]">Pay via Razorpay</button>
            <Link href="/" className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle2 size={16} className="text-[#3A9D5D]" /> Confirmation ready
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
