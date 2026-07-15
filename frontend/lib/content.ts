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
  badge: string;
  description: string;
  care: string[];
  sizes: string[];
  availability: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
};

export const categories = [
  { name: "Pakistani Suits", tag: "Lawn · Chiffon · Georgette" },
  { name: "Party Wear", tag: "Sequin · Embroidery · Velvet" },
  { name: "Wedding Collection", tag: "Bridal · Sabyasachi Inspired" },
  { name: "Luxury Edit", tag: "Handloom · Zardozi" },
  { name: "Summer Collection", tag: "Cotton · Pastels" },
  { name: "Tailoring Services", tag: "Custom Fit · Alterations" },
];

export const products: Product[] = [
  {
    id: 1,
    slug: "rose-embroidered-anarkali",
    name: "Rose Embroidered Anarkali",
    category: "Pakistani Suits",
    fabric: "Georgette",
    occasion: "Party Wear",
    color: "Rose",
    price: 3499,
    mrp: 4999,
    rating: 4.8,
    sold: 78,
    badge: "BESTSELLER",
    description:
      "An architectural hand-embroidered anarkali featuring rose thread work, a flattering flared silhouette, and premium georgette drape.",
    care: ["Dry clean recommended", "Store on padded hanger", "Avoid direct sunlight"],
    sizes: ["S", "M", "L", "XL"],
    availability: "In stock",
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 2,
    slug: "champagne-zardozi-kurta-set",
    name: "Champagne Zardozi Kurta Set",
    category: "Luxury Edit",
    fabric: "Silk",
    occasion: "Wedding",
    color: "Gold",
    price: 6999,
    mrp: 8999,
    rating: 4.9,
    sold: 34,
    badge: "HANDPICKED",
    description:
      "A lavish kurta set crafted in rich silk with tonal zardozi work, shaped for celebratory evenings and bridal-adjacent styling.",
    care: ["Dry clean only", "Use soft brush for embroidery", "Wrap in muslin"],
    sizes: ["S", "M", "L"],
    availability: "Limited stock",
    isFeatured: true,
  },
  {
    id: 3,
    slug: "ivory-chikankari-suit",
    name: "Ivory Chikankari Suit",
    category: "Pakistani Suits",
    fabric: "Cotton",
    occasion: "Festive",
    color: "Ivory",
    price: 2799,
    mrp: 3599,
    rating: 4.7,
    sold: 51,
    badge: "NEW",
    description:
      "A soft ivory chikankari suit with breathable cotton and delicate white-on-ivory detailing for everyday grace.",
    care: ["Gentle hand wash", "Steam lightly", "Avoid bleach"],
    sizes: ["XS", "S", "M", "L"],
    availability: "In stock",
    isNew: true,
  },
  {
    id: 4,
    slug: "emerald-sequin-sharara",
    name: "Emerald Sequin Sharara",
    category: "Party Wear",
    fabric: "Net",
    occasion: "Party Wear",
    color: "Green",
    price: 4299,
    mrp: 5999,
    rating: 4.6,
    sold: 22,
    badge: "LIMITED",
    description:
      "A luminous sharara with emerald sequin detailing, sculpted for high-energy evenings and festive glamour.",
    care: ["Dry clean only", "Handle sequins gently", "Store flat"],
    sizes: ["M", "L", "XL"],
    availability: "Low stock",
  },
  {
    id: 5,
    slug: "blush-organza-saree",
    name: "Blush Organza Saree",
    category: "Wedding Collection",
    fabric: "Organza",
    occasion: "Wedding",
    color: "Pink",
    price: 5499,
    mrp: 7499,
    rating: 4.9,
    sold: 40,
    badge: "EXCLUSIVE",
    description:
      "A modern blush organza drape with a light sheen and graceful fall, designed for weddings and celebratory evenings.",
    care: ["Dry clean only", "Do not wrinkle harshly", "Use tissue between folds"],
    sizes: ["Free Size"],
    availability: "In stock",
  },
  {
    id: 6,
    slug: "sky-cotton-coord-set",
    name: "Sky Cotton Co-ord Set",
    category: "Summer Collection",
    fabric: "Cotton",
    occasion: "Casual",
    color: "Blue",
    price: 1899,
    mrp: 2499,
    rating: 4.5,
    sold: 63,
    badge: "NEW",
    description:
      "A breezy cotton co-ord set in sky blue, ideal for warm weather dressing and understated elegance.",
    care: ["Machine wash cold", "Air dry", "Use mild detergent"],
    sizes: ["S", "M", "L"],
    availability: "In stock",
    isNew: true,
    isBestseller: true,
  },
  {
    id: 7,
    slug: "onyx-velvet-sharara",
    name: "Onyx Velvet Sharara",
    category: "Party Wear",
    fabric: "Velvet",
    occasion: "Party Wear",
    color: "Black",
    price: 4799,
    mrp: 6299,
    rating: 4.8,
    sold: 29,
    badge: "BESTSELLER",
    description:
      "A dramatic velvet sharara with a rich, plush finish and fluid silhouette that whispers luxury on every step.",
    care: ["Dry clean only", "Steam gently", "Store away from moisture"],
    sizes: ["M", "L", "XL"],
    availability: "In stock",
    isBestseller: true,
  },
  {
    id: 8,
    slug: "sabyasachi-inspired-lehenga",
    name: "Sabyasachi Inspired Lehenga",
    category: "Wedding Collection",
    fabric: "Silk",
    occasion: "Wedding",
    color: "Maroon",
    price: 8999,
    mrp: 11999,
    rating: 5.0,
    sold: 18,
    badge: "EXCLUSIVE",
    description:
      "An heirloom-inspired lehenga in rich maroon silk with regal texture and an opulent bridal finish.",
    care: ["Dry clean only", "Store in breathable cover", "Avoid perfume contact"],
    sizes: ["S", "M", "L"],
    availability: "Limited stock",
  },
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

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: string) {
  return products.filter((product) => product.category === category);
}
