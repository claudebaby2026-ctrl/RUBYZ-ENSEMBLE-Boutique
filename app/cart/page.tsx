import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";

export const metadata = {
  title: "Cart",
  description: "Elegant cart experience with quantity controls and pickup or delivery choices.",
};

export default function CartPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h1 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Your Cart</h1>
            <div className="mt-6 space-y-4">
              {[
                { name: "Rose Embroidered Anarkali", price: 3499 },
                { name: "Sky Cotton Co-ord Set", price: 1899 },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-[1.2rem] border border-black/5 bg-[#F8F5F1] p-4">
                  <div>
                    <p className="font-medium text-[#111111]">{item.name}</p>
                    <p className="mt-1 text-sm text-gray-600">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="rounded-full border border-black/10 p-2"><Minus size={14} /></button>
                    <span className="text-sm">1</span>
                    <button className="rounded-full border border-black/10 p-2"><Plus size={14} /></button>
                    <button className="rounded-full border border-black/10 p-2 text-[#D94F70]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>₹5,398</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>₹150</span></div>
              <div className="flex justify-between"><span>Coupon</span><span>—</span></div>
              <div className="mt-3 border-t border-black/5 pt-3 flex justify-between text-base font-semibold text-[#111111]"><span>Total</span><span>₹5,548</span></div>
            </div>
            <div className="mt-6 rounded-[1.2rem] bg-[#F8F5F1] p-4 text-sm">
              <p className="font-semibold text-[#111111]">Pickup or Delivery</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-full bg-[#111111] px-4 py-2 text-white">Delivery</button>
                <button className="rounded-full border border-black/10 px-4 py-2">Pickup</button>
              </div>
            </div>
            <Link href="/checkout" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
