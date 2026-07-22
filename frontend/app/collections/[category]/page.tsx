import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/content";
import { getSeoCategoryConfig, seoCategoryPages } from "@/lib/seo-categories";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";

export const dynamic = "force-dynamic";

// Pre-render params for every known category/garment-type slug so these
// URLs exist as real, crawlable routes (see SEO plan §2) rather than only
// resolving on-demand.
export function generateStaticParams() {
  return seoCategoryPages.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const config = getSeoCategoryConfig(category);
  if (!config) return {};

  const canonical = `${SITE_URL}/collections/${config.slug}`;
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
  };
}

export default async function CategoryLandingPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const config = getSeoCategoryConfig(category);
  if (!config) notFound();

  const allProducts = await getProducts();
  const matched = allProducts.filter(config.matches);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${SITE_URL}/collections` },
      { "@type": "ListItem", position: 3, name: config.label, item: `${SITE_URL}/collections/${config.slug}` },
    ],
  };

  return (
    <main className="bg-[#FBFAF8]">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <nav className="mb-6 text-xs uppercase tracking-[0.24em] text-gray-400">
          <Link href="/" className="hover:text-[#B68D40]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:text-[#B68D40]">Collections</Link>
          <span className="mx-2">/</span>
          <span className="text-[#111111]">{config.label}</span>
        </nav>

        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Shop the Edit</p>
        <h1 className="text-3xl text-[#111111] sm:text-4xl" style={{ fontFamily: "Playfair Display, serif" }}>
          {config.label} Collection
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600">{config.intro}</p>

        {matched.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {matched.map((product) => (
              <AnimatedProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[1.5rem] border border-black/5 bg-white p-8 text-sm text-gray-600 shadow-sm">
            New pieces in this edit are being added — in the meantime,{" "}
            <Link href="/collections" className="text-[#B68D40] underline">
              browse the full collection
            </Link>
            {" "}or message us on WhatsApp and we&apos;ll help you find the right piece.
          </div>
        )}

        <div className="mt-12 border-t border-black/5 pt-8">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-gray-400">Explore other edits</p>
          <div className="flex flex-wrap gap-2">
            {seoCategoryPages
              .filter((c) => c.slug !== config.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-[#111111] hover:border-[#B68D40] hover:text-[#B68D40]"
                >
                  {c.label}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
