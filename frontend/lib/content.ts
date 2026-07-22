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

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  fabric: string;
  occasion: string;
  color: string;
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

export const occasions = ["Wedding", "Festive", "Office", "Casual", "Party Wear", "Eid", "Diwali"];

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
  legalName: "[Legal / registered business name of RUBYZ Ensemble]",
  gstin: "[GSTIN, if registered]",
  address: "Plot 42, Janpath Lane, Bhubaneswar, Odisha, India",
  email: "hello@rubyzensemble.in",
  phone: "+91 78730 11110",
};

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
