export const brand = {
  name: "RUBYZ Ensemble",
  tagline: "Luxury ethnic fashion from Bhubaneswar",
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
  availability: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
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
