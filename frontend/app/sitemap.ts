import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/content";
import { seoCategoryPages } from "@/lib/seo-categories";

// Next.js App Router native file (SEO plan §5) — nothing previously told
// Google which URLs exist on the site at all.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/collections`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tailoring`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/shipping-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = seoCategoryPages.map((c) => ({
    url: `${SITE_URL}/collections/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Best-effort: if the API is unreachable at build/request time, still
  // return the static + category routes rather than failing the whole
  // sitemap.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
