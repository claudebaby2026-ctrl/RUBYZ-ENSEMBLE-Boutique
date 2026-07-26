import { AnimatedHero } from "@/components/ui/animated-hero";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { WhatsAppCommunityForm } from "@/components/ui/whatsapp-community-form";
import { occasions, reviews, brand, legalEntity, socialLinks, googleReviewsUrl, type Product } from "@/lib/content";
import { getProducts, getHomepageConfig, resolveImageUrl } from "@/lib/api";
import { InstagramIcon } from "@/components/icons/social-icons";
import Link from "next/link";
import { ArrowRight, Camera, Check, ExternalLink, Gem, Megaphone, Scissors, Sparkles, Truck } from "lucide-react";

// Homepage "Shop by Category" is deliberately trimmed to the 3 top-level
// entry points the client wants front-and-center — everything else
// (occasion/fabric taxonomy, garment-type pages) still exists for SEO but
// no longer clutters this grid. "Stitched"/"Unstitched" reuse the same
// /collections?type= filter already wired up in collections-explorer.tsx
// and linked from the footer.
const homeShopCategories = [
  { name: "All Pieces", tag: "Every one-of-a-kind suit in the boutique", href: "/collections" },
  { name: "Stitched", tag: "Ready-to-wear · Try and go", href: "/collections?type=stitched" },
  { name: "Unstitched", tag: "Custom Fit · Tailored to you", href: "/collections?type=unstitched" },
];

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
  const heroImage = resolveImageUrl(homepageConfig.hero_image);
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

  // Powers the "@handle" Instagram-style grid near the footer. Not a live
  // API embed (see comment at the section itself) — just the shop's own
  // product photography, deduped by product so the grid doesn't repeat
  // the same picture, capped at 12 tiles to match the original layout.
  const seenProductIds = new Set<number>();
  const instagramTiles = products
    .filter((p) => {
      if (seenProductIds.has(p.id) || !p.images?.[0]) return false;
      seenProductIds.add(p.id);
      return true;
    })
    .slice(0, 12)
    .map((p) => ({ id: p.id, name: p.name, image: resolveImageUrl(p.images![0]) }));

  return (
    <main className="bg-[#FDF2EC] text-[#3A2213]">
      {bannerText && (
        <div className="flex items-center justify-center gap-2 bg-[#3A2213] px-5 py-2.5 text-center text-xs uppercase tracking-[0.24em] text-white">
          <Megaphone size={13} className="shrink-0 text-[#B17F5E]" />
          <span>{bannerText}</span>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
        <AnimatedHero heading={heroHeading} subheading={heroSubheading} imageUrl={heroImage} />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Curated Edits</p>
            <h2 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
              Shop by Category
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          {homeShopCategories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group overflow-hidden rounded-[1.2rem] border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 sm:rounded-[1.5rem]"
            >
              <div className="h-32 bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)] p-3 sm:h-48 sm:p-6">
                <div className="flex h-full flex-col justify-between rounded-[1rem] border border-white/60 bg-white/40 p-3 sm:p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#B17F5E] sm:text-xs sm:tracking-[0.28em]">Shop</p>
                  <div>
                    <h3 className="text-base text-[#3A2213] sm:text-xl" style={{ fontFamily: "Playfair Display, serif" }}>
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

      <section className="bg-[#E9CFBA] py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Owner&apos;s Picks</p>
              <h2 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
                Featured
              </h2>
            </div>
            <Link href="/collections" className="text-sm uppercase tracking-[0.28em] text-[#3A2213] hover:text-[#B17F5E]">
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
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Most Loved</p>
            <h2 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
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

      <section className="bg-[#3A2213] py-10 sm:py-16 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Inspired Looks</p>
          <h2 className="mb-8 text-3xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Celebrity Inspired Looks
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { name: "Manish Malhotra", description: "Regal shimmer with couture energy." },
              { name: "Sabyasachi", description: "Textural drama and heirloom elegance." },
            ].map((look) => (
              <div key={look.name} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-6 h-48 rounded-[1.2rem] bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)]" />
                <h3 className="text-xl">Inspired by {look.name}</h3>
                <p className="mt-2 text-sm text-gray-300">{look.description}</p>
                <Link href="/collections" className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-[#B17F5E]">
                  Explore Collection <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <h2 className="mb-8 text-center text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
          Shop by Occasion
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-7">
          {occasions.map((occasion) => (
            // Was a static, unlinked tag — now a real internal link into the
            // filtered collections view so these keywords (Wedding, Eid,
            // Diwali, etc.) actually pass link equity and are crawlable
            // rather than being dead-end decoration.
            <Link
              key={occasion}
              href={`/collections?occasion=${encodeURIComponent(occasion)}`}
              className="group rounded-[1rem] border border-black/5 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#B17F5E]/50 sm:p-4"
            >
              <Gem size={18} className="mx-auto mb-2 text-[#B17F5E] sm:mb-3" />
              <p className="text-sm text-[#3A2213] group-hover:text-[#B17F5E]">{occasion}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#E9CFBA] py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Sparkles, title: "Premium Fabrics" },
            { icon: Scissors, title: "Expert Tailoring" },
            { icon: Check, title: "Handpicked Collections" },
            { icon: Truck, title: "Nationwide Shipping" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="rounded-[1.2rem] bg-white p-6 text-center shadow-sm">
              <Icon className="mx-auto mb-3 text-[#B17F5E]" size={24} />
              <p className="text-sm text-[#3A2213]">{title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Made for You</p>
            <h2 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
              Tailoring that feels personal.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              Every piece can be tailored to your measurements. We offer bespoke alterations and made-to-measure refinement for a truly elevated fit.
            </p>
            <Link href="/tailoring" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#3A2213] px-6 py-3 text-sm font-medium text-white">
              Book Tailoring <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-[1.5rem] border border-black/5 bg-[#3A2213] p-6 text-white">
            <div className="h-60 rounded-[1.2rem] bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)]" />
          </div>
        </div>
      </section>

      <section className="bg-[#E9CFBA] py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="mb-8 text-center text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
            Customer Reviews
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.name} className="rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-sm leading-7 text-gray-700">“{review.text}”</p>
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[#B17F5E]">{review.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm uppercase tracking-[0.28em] text-[#3A2213] transition hover:border-[#B17F5E] hover:text-[#B17F5E]"
            >
              Read More on Google <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-8">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Camera size={18} className="text-[#D94F70]" />
          <h2 className="text-2xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
            @{brand.name.toLowerCase().replace(/\s+/g, "")}
          </h2>
        </div>
        {/* Was 12 empty gradient placeholders with no real content or links.
            This isn't a live Instagram API embed (that needs a Business
            account + Graph API access token, or a third-party embed
            widget) — instead it repurposes the shop's own product
            photography into an Instagram-style grid, so it's never empty,
            and every tile links out to the real profile so it still drives
            follows/traffic the way an embed would. Swap in real post
            permalinks later if/when API access is set up. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {instagramTiles.map((tile, index) => (
            <a
              key={tile.id ?? index}
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${brand.name} on Instagram`}
              className="group relative aspect-square overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)]"
            >
              {tile.image && (
                <img
                  src={tile.image}
                  alt={tile.name ?? brand.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <InstagramIcon size={22} className="text-white" />
              </div>
            </a>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm uppercase tracking-[0.28em] text-[#3A2213] transition hover:border-[#B17F5E] hover:text-[#B17F5E]"
          >
            <InstagramIcon size={16} /> Follow Us
          </a>
        </div>
      </section>

      <section className="bg-[#3A2213] py-10 sm:py-16 text-white">
        <div className="mx-auto max-w-xl px-5 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#B17F5E]">Hey Beautiful Ladies!</p>
          <h2 className="mt-2 text-2xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Join Our Fashion Community on WhatsApp
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Early access to new collections and styling notes. To view our WhatsApp status, please
            fill the form below — and save our WhatsApp number, {legalEntity.phone}, so we can
            reach you to place orders in future.
          </p>
          <WhatsAppCommunityForm />
        </div>
      </section>
    </main>
  );
}
