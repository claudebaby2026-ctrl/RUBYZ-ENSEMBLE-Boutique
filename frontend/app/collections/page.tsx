import { Suspense } from "react";
import type { Metadata } from "next";
import { CollectionsExplorer } from "@/components/collections/collections-explorer";
import { getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/content";
import { slugForCategoryName } from "@/lib/seo-categories";

export const dynamic = "force-dynamic";

// The ?category=/?q= filtered views of this page are all served from the
// same base route, so without an explicit canonical Google can treat every
// filter combination as a separate duplicate page (SEO plan §5). When the
// category param matches one of our dedicated landing pages
// (app/collections/[category]), point the canonical there instead — that
// page has the real unique content for that keyword.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const dedicatedSlug = category ? slugForCategoryName(category) : undefined;
  const canonical = dedicatedSlug ? `${SITE_URL}/collections/${dedicatedSlug}` : `${SITE_URL}/collections`;

  return {
    title: "Collections",
    description: "Browse premium ethnic fashion collections with luxury filters and thoughtful curation.",
    alternates: { canonical },
  };
}

export default async function CollectionsPage() {
  const products = await getProducts();
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        {/* CollectionsExplorer reads ?q= via useSearchParams, which requires
            a Suspense boundary so Next.js doesn't force this whole route to
            de-opt to fully client-rendered. */}
        <Suspense fallback={null}>
          <CollectionsExplorer products={products} />
        </Suspense>
      </section>
    </main>
  );
}