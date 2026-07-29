// Canonical site origin — reused anywhere we need to build an absolute URL
// (canonical tags, JSON-LD @id/url fields, sitemap entries) instead of
// hardcoding the domain in multiple files. Matches app/layout.tsx's
// metadataBase.
export const SITE_URL = "https://rubyzensemble.in";

export const brand = {
  name: "RUBYZ Ensemble",
  tagline: "Luxury ethnic fashion from Bhubaneswar",
  // Digits-only, country code first — the format wa.me links require.
  // Same number as legalEntity.phone ("+91 78730 11110"), reused here so
  // every WhatsApp deep link (product enquiry, checkout hand-off) points
  // at one place instead of being hardcoded per call site.
  whatsappNumber: "917873011110",
  colors: {
    ink: "#111111",
    gold: "#B68D40",
    beige: "#F8F5F1",
    rose: "#D94F70",
    bg: "#FBFAF8",
    white: "#FFFFFF",
  },
};

// Social profile URLs — reused in the header, footer, and the
// ClothingStore JSON-LD `sameAs` field (app/layout.tsx) so every "Follow
// Us" link and the schema markup stay in sync from one place.
export const socialLinks = {
  facebook: "https://www.facebook.com/ruby.hans.735/",
  instagram: "https://www.instagram.com/rubyzensemble_",
  youtube: "https://www.youtube.com/channel/UCv7ExbmHDxnGmluD7dYYgXQ",
  whatsapp: `https://wa.me/${brand.whatsappNumber}`,
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  // Full multi-category selection (category is always kept as
  // categories[0] for backward compatibility — see backend
  // crud/product.py). Optional so nothing that only reads/writes
  // `category` needs to change.
  categories?: string[];
  fabric: string;
  occasion?: string;
  color?: string;
  price: number;
  mrp: number;
  rating: number;
  sold: number;
  stock?: number;
  badge: string;
  description: string;
  care: string[];
  sizes: string[];
  images?: string[];
  videos?: string[];
  availability: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  // Optional per-product Shiprocket shipping override (kg / cm). Never set
  // from Add Product — only ever edited via Edit Product's collapsed
  // "Shipping override" section. Undefined/null means "use the
  // category/store-wide default", never treated as zero.
  weight?: number | null;
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
};

// Static site taxonomy — not product data. Product records themselves are
// only ever read from the FastAPI + database backend (see lib/api.ts).
export const categories = [
  { name: "Pakistani Suits", tag: "Lawn · Chiffon · Georgette" },
  { name: "Party Wear", tag: "Sequin · Embroidery · Velvet" },
  { name: "Wedding Collection", tag: "Bridal · Sabyasachi Inspired" },
  { name: "Luxury Edit", tag: "Handloom · Zardozi" },
  { name: "Summer Collection", tag: "Cotton · Pastels" },
  { name: "Tailoring Services", tag: "Custom Fit · Alterations" },
];

export const reviews = [
  {
    name: "Ananya, Bhubaneswar",
    text: "The Anarkali fit perfectly after their tailoring team adjusted the sleeves. Feels like a designer piece.",
    rating: 5,
  },
  {
    name: "Riya, Cuttack",
    text: "Fabric quality is far better than what I expected online. Delivery was on time for my sister's wedding.",
    rating: 5,
  },
  {
    name: "Meher, Puri",
    text: "Loved the personal styling advice over WhatsApp before I even ordered.",
    rating: 4,
  },
];

export const footerLinks = [
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/tailoring", label: "Tailoring" },
  { href: "/contact", label: "Contact" },
];

// Business details used across the legal/compliance pages. NOTE: the
// bracketed placeholders should be replaced with the registered business's
// actual legal name and GSTIN before going live / submitting these pages
// for Razorpay or Shiprocket verification.
export const legalEntity = {
  legalName: "Rubyz Ensemble",
  gstin: "21ACZPH7767A1ZF",
  streetAddress: "RUBYZ-ENSEMBLE Boutique, Home-Town Road, Plot no 93, near Prayash Park, Satya Nagar",
  addressLocality: "Bhubaneswar",
  addressRegion: "Odisha",
  postalCode: "751007",
  addressCountry: "India",
  get address() {
    return `${this.streetAddress}, ${this.addressLocality}, ${this.addressRegion} ${this.postalCode}, ${this.addressCountry}`;
  },
  phone: "+91 78730 11110",
};

// RUBYZ-ENSEMBLE Boutique's actual, verified Google Business Profile place_id
// (confirmed via Places lookup: "RUBYZ-ENSEMBLE Boutique.", Home-Town Road,
// Plot no 93, near Prayash Park, Satya Nagar, Bhubaneswar). Reused both to
// build the reviews deep link below and to pull live reviews server-side —
// see lib/google-reviews.ts.
export const googlePlaceId = "ChIJFYepAO8LGToRdNWE7bZPXQo";

// Direct link to the reviews tab of the Business Profile above. Unlike a
// plain maps.google.com/maps/search query — which just runs a text search
// and may land on the wrong result or the general place page — this
// search.google.com/local/reviews?placeid= form is Google's own supported
// pattern for deep-linking straight into a specific listing's reviews.
export const googleReviewsUrl = `https://search.google.com/local/reviews?placeid=${googlePlaceId}`;

// Pages required for Razorpay merchant verification and Shiprocket seller
// onboarding: Privacy Policy, Terms & Conditions, Shipping Policy and a
// Cancellation/Refund Policy, each reachable from a compact footer strip
// rather than the main nav so they don't compete for space with the
// storefront's primary links.
export const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/refund-policy", label: "Cancellation & Refund Policy" },
];
