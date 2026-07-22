import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, resolveImageUrl } from "@/lib/api";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { AddToCartPanel } from "@/components/product/add-to-cart-panel";
import { LikeButton } from "@/components/product/like-button";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { StockBadge } from "@/components/product/stock-badge";
import { getDiscountPercent, getStockStatus } from "@/lib/stock";
import { SITE_URL } from "@/lib/content";

export const dynamic = "force-dynamic";

// Truncates to a max length on a word boundary and appends an ellipsis,
// so meta descriptions don't cut off mid-word.
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

// Was previously a hardcoded "Product Details" string on every product —
// the single biggest on-page SEO gap (see SEO plan §3): every product page
// had identical metadata, so Google had no way to tell "Rose Embroidered
// Anarkali" apart from any other product in search results or link
// previews. Now built per-product from real data.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  // layout.tsx's title.template ("%s | RUBYZ Ensemble") already appends the
  // brand, so the per-product title just needs the product name itself —
  // avoids double-appending "RUBYZ Ensemble".
  const title = product.name;
  const description = truncate(
    `${product.description} ₹${product.price}. Shop luxury ethnic wear at RUBYZ Ensemble, Bhubaneswar.`,
    155
  );
  const canonical = `${SITE_URL}/products/${product.slug}`;
  const image = resolveImageUrl(product.images?.[0]);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  // Prefer pieces that actually share a category or occasion with this
  // product over an arbitrary "first four others" slice, so "Related
  // Pieces" is genuinely related rather than coincidentally adjacent.
  const related = allProducts
    .filter((item) => item.id !== product.id)
    .map((item) => ({
      item,
      score:
        Number(item.category === product.category) * 2 +
        Number(item.occasion === product.occasion),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item);
  const images = (product.images ?? []).map((img) => resolveImageUrl(img)).filter(Boolean) as string[];
  const mainImage = images[0];
  const discount = getDiscountPercent(product);
  const canonicalUrl = `${SITE_URL}/products/${product.slug}`;

  // Product structured data (SEO plan §4b) — reuses getStockStatus() so
  // availability here always matches the stock badge shown on the page
  // instead of duplicating that logic. No aggregateRating is included
  // since reviews aren't yet tied to real per-product data (see §4b note
  // on avoiding fake ratings, which is a Google Merchant Center policy
  // violation).
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.description,
    sku: String(product.id),
    brand: { "@type": "Brand", name: "RUBYZ Ensemble" },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "INR",
      price: product.price,
      availability:
        getStockStatus(product) === "out-of-stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: product.category, item: `${SITE_URL}/collections` },
      { "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <main className="bg-[#FBFAF8]">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-[0_20px_60px_rgba(17,17,17,0.06)] sm:rounded-[2rem] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-[#111111] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white">{product.badge}</span>
              <LikeButton productId={product.id} className="rounded-full border border-black/10 p-2" />
            </div>
            {mainImage ? (
              <ProductImageGallery images={images} alt={product.name} fabric={product.fabric} />
            ) : (
              <div className="h-[320px] rounded-[1.1rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)] sm:h-[400px] sm:rounded-[1.4rem] lg:h-[440px]" />
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Featured Piece</p>
            <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              {product.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-600">{product.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#F8F5F1] px-3 py-1 text-sm text-[#111111]">{product.category}</span>
              <span className="rounded-full bg-[#F8F5F1] px-3 py-1 text-sm text-[#111111]">{product.fabric}</span>
              <span className="rounded-full bg-[#F8F5F1] px-3 py-1 text-sm text-[#111111]">{product.occasion}</span>
            </div>

            <div className="mt-8 flex items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Price</p>
                <p className="text-3xl text-[#111111]">₹{product.price}</p>
              </div>
              <p className="text-sm text-gray-400 line-through">₹{product.mrp}</p>
              {discount !== null && (
                <span className="rounded-full bg-[#D94F70]/10 px-2.5 py-1 text-xs font-semibold text-[#D94F70]">{discount}% OFF</span>
              )}
            </div>

            <AddToCartPanel product={product} image={images[0]} />

            <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="text-xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Product Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Fabric</p>
                  <p className="mt-1 text-sm text-gray-600">{product.fabric}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Availability</p>
                  <p className="mt-1 text-sm">
                    <StockBadge product={product} />
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Sizes</p>
                  <p className="mt-1 text-sm text-gray-600">{product.sizes.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Care</p>
                  <p className="mt-1 text-sm text-gray-600">{product.care.join(" • ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Related Pieces</p>
            <h2 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              You may also love
            </h2>
          </div>
          <Link href="/collections" className="text-sm uppercase tracking-[0.28em] text-[#111111] hover:text-[#B68D40]">View All</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {related.map((item) => (
            <AnimatedProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
