import type { Product } from "@/lib/content";
import { categories } from "@/lib/content";

export type SeoCategoryConfig = {
  slug: string;
  /** H1 / nav label */
  label: string;
  /** <title> — kept short, the layout's "%s | RUBYZ Ensemble" template appends the brand. */
  title: string;
  /** Meta description, ~150-160 chars. */
  description: string;
  /** 100-200 word unique intro paragraph rendered on the page, naturally
   *  repeating the target keyword + variants 3-5 times (see SEO plan §2). */
  intro: string;
  /** Matches products that belong on this landing page. */
  matches: (product: Product) => boolean;
};

function textIncludesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

function productText(product: Product): string {
  return [product.name, product.category, product.fabric, product.description]
    .filter(Boolean)
    .join(" ");
}

// Garment-type landing pages — these are the exact words people type into
// Google ("anarkali", "lehenga", "chikankari suit") but today only exist
// inside individual product names/fabric text, not a filterable taxonomy
// field. Until the backend grows a proper `garment_type` attribute (see
// SEO plan §2), we match against name/category/fabric/description text so
// these pages are real and populated today rather than blocked on a
// backend migration.
const garmentTypePages: SeoCategoryConfig[] = [
  {
    slug: "lehenga",
    label: "Lehenga",
    title: "Lehenga Collection",
    description:
      "Shop hand-embroidered bridal and party lehengas in silk, georgette and velvet at RUBYZ Ensemble, Bhubaneswar. Custom tailoring available.",
    intro:
      "Explore our Lehenga collection — hand-embroidered bridal lehengas, party-wear lehengas, and festive lehenga sets in silk, georgette, and velvet. Whether you're shopping for a wedding lehenga, an engagement outfit, or a Diwali-ready ensemble, each lehenga in this edit is sourced directly from craftsmen in Delhi, Mumbai, Lucknow and Surat and finished with RUBYZ Ensemble's in-house tailoring. Every lehenga can be tailored to your measurements at our Bhubaneswar boutique, so brides and guests across Odisha get a designer fit without the designer wait. Browse by fabric, colour, and occasion below to find your lehenga.",
    matches: (product) => textIncludesAny(productText(product), ["lehenga", "lehnga", "lehanga"]),
  },
  {
    slug: "anarkali",
    label: "Anarkali",
    title: "Anarkali Suits Collection",
    description:
      "Shop Anarkali suits in chikankari, georgette and silk — hand-embroidered, festive-ready anarkalis at RUBYZ Ensemble, Bhubaneswar.",
    intro:
      "Shop our Anarkali suit collection — hand-embroidered anarkalis in georgette, chikankari, and silk, perfect for weddings and festive occasions in Bhubaneswar and beyond. From floor-length bridal anarkalis to shorter anarkali kurtis for office and casual festive wear, this edit covers every occasion an anarkali suit is made for. Each anarkali is finished with detailed embroidery work and can be custom-tailored to your measurements. If you're searching for an anarkali suit for a wedding function, Eid, or Diwali, start here — every piece ships pan-India with the option of in-boutique alterations for Bhubaneswar and Cuttack customers.",
    matches: (product) => textIncludesAny(productText(product), ["anarkali"]),
  },
  {
    slug: "chikankari",
    label: "Chikankari",
    title: "Chikankari Suits & Kurtis",
    description:
      "Shop authentic Lucknowi chikankari suits and kurtis — hand-embroidered chikankari ethnic wear at RUBYZ Ensemble, Bhubaneswar.",
    intro:
      "Discover our Chikankari collection — authentic Lucknowi chikankari suits and chikankari kurtis, hand-embroidered using traditional techniques. Chikankari work is prized for its delicate, breathable finish, making a chikankari suit equally suited to a summer wedding function or an everyday festive occasion. Each chikankari piece here is sourced directly from craft clusters and checked for embroidery quality before it reaches the boutique. Pair a chikankari kurti with our tailoring service for a fit that's entirely yours, or shop a ready-to-wear chikankari suit for same-week festive wear.",
    matches: (product) => textIncludesAny(productText(product), ["chikankari", "chikan"]),
  },
  {
    slug: "sarees",
    label: "Sarees",
    title: "Saree Collection",
    description:
      "Shop silk, organza and handloom sarees with zardozi work at RUBYZ Ensemble — designer sarees for weddings and festive wear, Bhubaneswar.",
    intro:
      "Browse our saree collection — silk sarees, organza sarees, and handloom weaves with zardozi and thread embroidery, curated for weddings, festive occasions, and everyday elegance. A well-draped saree remains one of the most versatile pieces of ethnic wear, and this edit spans bridal silk sarees through to lighter organza sarees for a modern wedding guest. Every saree comes with the option of blouse stitching through our tailoring service, so it arrives ready to wear rather than ready to alter. Explore by fabric and occasion to find the saree that suits your event.",
    matches: (product) => textIncludesAny(productText(product), ["saree", "sari"]),
  },
];

// Existing taxonomy categories (lib/content.ts::categories) also get a
// dedicated, server-rendered landing page with unique copy — not just the
// client-filtered /collections?category= query string — so internal
// category names like "Wedding Collection" or "Party Wear" are indexable
// URLs in their own right.
function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const taxonomyIntros: Record<string, { title: string; description: string; intro: string }> = {
  "Pakistani Suits": {
    title: "Pakistani Suits Collection",
    description:
      "Shop Pakistani suits in lawn, chiffon and georgette at RUBYZ Ensemble, Bhubaneswar — festive and everyday ethnic wear.",
    intro:
      "Our Pakistani suits collection brings together lawn, chiffon, and georgette Pakistani suit sets known for their flowing silhouettes and detailed embroidery. Whether you're dressing for a festive gathering or looking for elegant everyday ethnic wear, these Pakistani suits are sourced directly from trusted manufacturers and tailored to fit at our Bhubaneswar boutique.",
  },
  "Party Wear": {
    title: "Party Wear Collection",
    description:
      "Shop sequin, embroidered and velvet party wear gowns and suits at RUBYZ Ensemble, Bhubaneswar — festive party outfits.",
    intro:
      "Our party wear edit covers sequin gowns, embroidered suits, and velvet ensembles built for celebrations — engagement parties, sangeets, and festive get-togethers. Each party wear piece is chosen for how it photographs and moves, then finished with RUBYZ Ensemble's tailoring so it fits the occasion exactly.",
  },
  "Wedding Collection": {
    title: "Wedding Collection",
    description:
      "Shop bridal and Sabyasachi-inspired wedding lehengas, suits and sarees at RUBYZ Ensemble, Bhubaneswar.",
    intro:
      "Our Wedding Collection is built for every function on the wedding calendar — bridal lehengas, Sabyasachi-inspired ensembles, and festive suits and sarees for guests. Each wedding outfit here is hand-embroidered and can be custom-tailored at our Bhubaneswar boutique, so brides and wedding guests across Odisha get a designer fit without the designer wait.",
  },
  "Luxury Edit": {
    title: "Luxury Edit",
    description:
      "Shop handloom and zardozi luxury ethnic wear at RUBYZ Ensemble, Bhubaneswar — premium fabrics, detailed craftsmanship.",
    intro:
      "The Luxury Edit gathers our most detailed pieces — handloom weaves and zardozi embroidery worked by craftsmen we source from directly. This is the collection to shop when the occasion calls for the finest fabric and the most intricate handwork RUBYZ Ensemble carries.",
  },
  "Summer Collection": {
    title: "Summer Collection",
    description:
      "Shop breathable cotton and pastel ethnic wear at RUBYZ Ensemble, Bhubaneswar — lightweight suits for warm-weather occasions.",
    intro:
      "Our Summer Collection is built around breathable cotton and soft pastel tones, made for warm-weather festive occasions and everyday wear alike. Every piece balances comfort with the embroidery and detailing RUBYZ Ensemble is known for.",
  },
};

const taxonomyPages: SeoCategoryConfig[] = categories
  .filter((c) => c.name !== "Tailoring Services") // has its own dedicated /tailoring page already
  .map((c) => {
    const copy = taxonomyIntros[c.name];
    return {
      slug: slugifyCategoryName(c.name),
      label: c.name,
      title: copy?.title ?? c.name,
      description: copy?.description ?? `Shop the ${c.name} collection at RUBYZ Ensemble, Bhubaneswar.`,
      intro: copy?.intro ?? `Shop the ${c.name} collection at RUBYZ Ensemble, Bhubaneswar.`,
      matches: (product: Product) => product.category === c.name,
    };
  });

// Combined list backing app/collections/[category]/page.tsx. Garment-type
// pages are listed first since they're the higher-intent SEO targets.
export const seoCategoryPages: SeoCategoryConfig[] = [...garmentTypePages, ...taxonomyPages];

// The garment-type slugs specifically (lehenga/anarkali/chikankari/sarees)
// — used for nav/footer internal links since these are the exact-match
// keyword pages the SEO plan calls out as highest priority to link to.
export const garmentTypeLinks = garmentTypePages.map((c) => ({ slug: c.slug, label: c.label }));

export function getSeoCategoryConfig(slug: string): SeoCategoryConfig | undefined {
  return seoCategoryPages.find((c) => c.slug === slug);
}

// Used by the legacy /collections?category= query param so links to the
// old-style URL still resolve to the right dedicated page's slug for
// canonicalization, even though the category taxonomy stores display
// names ("Wedding Collection") rather than slugs.
export function slugForCategoryName(name: string): string | undefined {
  return seoCategoryPages.find((c) => c.label === name)?.slug;
}
