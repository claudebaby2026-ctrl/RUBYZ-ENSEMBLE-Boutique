import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

// SEO plan §5 — disallow customer-account/private-utility pages (no SEO
// value, no reason to spend crawl budget on them). Paired with per-page
// `noindex` on the same routes (see app/{dashboard,login,cart,checkout,
// orders,wishlist}/layout.tsx) since robots.txt only stops crawling, not
// indexing of a URL linked to from elsewhere.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/cart", "/checkout", "/orders", "/wishlist"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
