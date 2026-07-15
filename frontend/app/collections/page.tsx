import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { products, categories } from "@/lib/content";

export const metadata = {
  title: "Collections",
  description: "Browse premium ethnic fashion collections with luxury filters and thoughtful curation.",
};

export default function CollectionsPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_20px_60px_rgba(17,17,17,0.06)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Collections</p>
            <h1 className="mt-2 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              Curated for celebration, comfort, and couture.
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-[#F8F5F1] px-4 py-3">
            <Search size={16} />
            <input placeholder="Search silhouettes" className="bg-transparent text-sm outline-none" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#B68D40]" />
              <p className="text-sm font-semibold uppercase tracking-[0.28em]">Filters</p>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-[#111111]">Category</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {categories.map((category) => (
                    <label key={category.name} className="flex items-center gap-2">
                      <input type="checkbox" /> {category.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111111]">Price</p>
                <div className="mt-3 flex gap-3 text-sm text-gray-600">
                  <span>₹1,500</span>
                  <span>₹12,000</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111111]">Fabric</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {['Cotton','Georgette','Silk','Net','Velvet'].map((fabric) => <label key={fabric} className="flex items-center gap-2"><input type="checkbox" /> {fabric}</label>)}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-between rounded-[1rem] border border-black/5 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-600">Showing {products.length} luxurious pieces</p>
              <select className="rounded-full border border-black/10 bg-[#F8F5F1] px-3 py-2 text-sm">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <AnimatedProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
