import { AnimatedHero } from "@/components/ui/animated-hero";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { categories, occasions, reviews, brand, type Product } from "@/lib/content";
import { getProducts, getHomepageConfig } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, Camera, Check, Gem, Megaphone, Scissors, Sparkles, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, homepageConfig] = await Promise.all([getProducts(), getHomepageConfig()]);

  // Featured module is driven by the owner's Homepage Editor selection.
  // Falls back to the first few products (the old static behavior) when
  // nothing has been configured yet, so the section is never empty.
  const featuredProducts: Product[] =
    homepageConfig.featured_product_ids.length > 0
      ? homepageConfig.featured_product_ids
          .map((id) => products.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p))
      : products.slice(0, 4);

  const heroHeading = homepageConfig.hero_heading?.trim() || undefined;
  const heroSubheading = homepageConfig.hero_subheading?.trim() || undefined;
  const bannerText = homepageConfig.banner_text?.trim();

  // "Best Sellers" is data-driven off actual sales (Product.sold), not a
  // hardcoded slice — mirrors the dashboard's own "Best Seller" stat.
  // Excludes anything already shown in Featured above so the two sections
  // don't just duplicate each other.
  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const bestSellers: Product[] = [...products]
    .filter((p) => !featuredIds.has(p.id))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  return (
    <main className="bg-[#FBFAF8] text-[#111111]">
      {bannerText && (
        <div className="flex items-center justify-center gap-2 bg-[#111111] px-5 py-2.5 text-center text-xs uppercase tracking-[0.24em] text-white">
          <Megaphone size={13} className="shrink-0 text-[#B68D40]" />
          <span>{bannerText}</span>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
        <AnimatedHero heading={heroHeading} subheading={heroSubheading} />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Curated Edits</p>
            <h2 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              Shop by Category
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.name} href="/collections" className="group overflow-hidden rounded-[1.2rem] border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 sm:rounded-[1.5rem]">
              <div className="h-32 bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)] p-3 sm:h-48 sm:p-6">
                <div className="flex h-full flex-col justify-between rounded-[1rem] border border-white/60 bg-white/40 p-3 sm:p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#B68D40] sm:text-xs sm:tracking-[0.28em]">Featured</p>
                  <div>
                    <h3 className="text-base text-[#111111] sm:text-xl" style={{ fontFamily: "Playfair Display, serif" }}>
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">{category.tag}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#F8F5F1] py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Owner&apos;s Picks</p>
              <h2 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
                Featured
              </h2>
            </div>
            <Link href="/collections" className="text-sm uppercase tracking-[0.28em] text-[#111111] hover:text-[#B68D40]">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <AnimatedProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Most Loved</p>
            <h2 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              Best Sellers
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {bestSellers.map((product) => (
            <AnimatedProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-[#111111] py-10 sm:py-16 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Inspired Looks</p>
          <h2 className="mb-8 text-3xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Celebrity Inspired Looks
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { name: "Manish Malhotra", description: "Regal shimmer with couture energy." },
              { name: "Sabyasachi", description: "Textural drama and heirloom elegance." },
            ].map((look) => (
              <div key={look.name} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-6 h-48 rounded-[1.2rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
                <h3 className="text-xl">Inspired by {look.name}</h3>
                <p className="mt-2 text-sm text-gray-300">{look.description}</p>
                <Link href="/collections" className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-[#B68D40]">
                  Explore Collection <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <h2 className="mb-8 text-center text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
          Shop by Occasion
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-7">
          {occasions.map((occasion) => (
            <div key={occasion} className="rounded-[1rem] border border-black/5 bg-white p-3 text-center shadow-sm sm:p-4">
              <Gem size={18} className="mx-auto mb-2 text-[#B68D40] sm:mb-3" />
              <p className="text-sm text-[#111111]">{occasion}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F8F5F1] py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Sparkles, title: "Premium Fabrics" },
            { icon: Scissors, title: "Expert Tailoring" },
            { icon: Check, title: "Handpicked Collections" },
            { icon: Truck, title: "Nationwide Shipping" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="rounded-[1.2rem] bg-white p-6 text-center shadow-sm">
              <Icon className="mx-auto mb-3 text-[#B68D40]" size={24} />
              <p className="text-sm text-[#111111]">{title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Made for You</p>
            <h2 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              Tailoring that feels personal.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              Every piece can be tailored to your measurements. We offer bespoke alterations and made-to-measure refinement for a truly elevated fit.
            </p>
            <Link href="/tailoring" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white">
              Book Tailoring <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-[1.5rem] border border-black/5 bg-[#111111] p-6 text-white">
            <div className="h-60 rounded-[1.2rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
          </div>
        </div>
      </section>

      <section className="bg-[#F8F5F1] py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="mb-8 text-center text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
            Customer Reviews
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.name} className="rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-sm leading-7 text-gray-700">“{review.text}”</p>
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[#B68D40]">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Camera size={18} className="text-[#D94F70]" />
          <h2 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
            @{brand.name.toLowerCase().replace(/\s+/g, "")}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-square rounded-[1rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
          ))}
        </div>
      </section>

      <section className="bg-[#111111] py-10 sm:py-16 text-white">
        <div className="mx-auto max-w-xl px-5 text-center lg:px-8">
          <h2 className="text-2xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Join Our Fashion Community
          </h2>
          <p className="mt-3 text-sm text-gray-400">Early access to new collections and styling notes.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input placeholder="Your email" className="flex-1 rounded-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500" />
            <button className="rounded-full bg-[#B68D40] px-6 py-3 text-sm font-medium text-[#111111]">Subscribe</button>
          </div>
        </div>
      </section>
    </main>
  );
}
