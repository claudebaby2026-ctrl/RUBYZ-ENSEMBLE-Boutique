import React, { useState, useMemo } from "react";
import {
  Search, Heart, ShoppingBag, User, ChevronDown, ChevronLeft, ChevronRight,
  Star, X, Plus, Minus, MessageCircle, Menu, Scissors, Truck, Gem, Ruler,
  Instagram, MapPin, Phone, Mail, Check
} from "lucide-react";

/* ---------------------------------------------------------
   RUBYZ ENSEMBLE — Design tokens (per brief)
   bg #FFFFFF | ink #111111 | gold #B68D40 | beige #F8F5F1 | rose #D94F70
   Headings: Playfair Display | Body: Inter | Price: Poppins
--------------------------------------------------------- */
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=Poppins:wght@500;600&display=swap');`;

const COLORS = {
  bg: "#FFFFFF",
  ink: "#111111",
  gold: "#B68D40",
  beige: "#F8F5F1",
  rose: "#D94F70",
};

/* ---------- Mock data ---------- */
const CATEGORIES = [
  { name: "Pakistani Suits", tag: "Lawn · Chiffon · Georgette" },
  { name: "Party Wear", tag: "Sequin · Embroidery · Velvet" },
  { name: "Wedding Collection", tag: "Bridal · Sabyasachi Inspired" },
  { name: "Luxury Edit", tag: "Handloom · Zardozi" },
  { name: "Summer Collection", tag: "Cotton · Pastels" },
  { name: "Tailoring Services", tag: "Custom Fit · Alterations" },
];

const PRODUCTS = [
  { id: 1, name: "Rose Embroidered Anarkali", cat: "Pakistani Suits", fabric: "Georgette", occasion: "Party Wear", color: "Rose", price: 3499, mrp: 4999, rating: 4.8, sold: 78, badge: "BESTSELLER" },
  { id: 2, name: "Champagne Zardozi Kurta Set", cat: "Luxury Edit", fabric: "Silk", occasion: "Wedding", color: "Gold", price: 6999, mrp: 8999, rating: 4.9, sold: 34, badge: "HANDPICKED" },
  { id: 3, name: "Ivory Chikankari Suit", cat: "Pakistani Suits", fabric: "Cotton", occasion: "Festive", color: "Ivory", price: 2799, mrp: 3599, rating: 4.7, sold: 51, badge: "NEW" },
  { id: 4, name: "Emerald Sequin Sharara", cat: "Party Wear", fabric: "Net", occasion: "Party Wear", color: "Green", price: 4299, mrp: 5999, rating: 4.6, sold: 22, badge: "LIMITED" },
  { id: 5, name: "Blush Organza Saree", cat: "Wedding Collection", fabric: "Organza", occasion: "Wedding", color: "Pink", price: 5499, mrp: 7499, rating: 4.9, sold: 40, badge: "EXCLUSIVE" },
  { id: 6, name: "Sky Cotton Co-ord Set", cat: "Summer Collection", fabric: "Cotton", occasion: "Casual", color: "Blue", price: 1899, mrp: 2499, rating: 4.5, sold: 63, badge: "NEW" },
  { id: 7, name: "Onyx Velvet Sharara", cat: "Party Wear", fabric: "Velvet", occasion: "Party Wear", color: "Black", price: 4799, mrp: 6299, rating: 4.8, sold: 29, badge: "BESTSELLER" },
  { id: 8, name: "Sabyasachi Inspired Lehenga", cat: "Wedding Collection", fabric: "Silk", occasion: "Wedding", color: "Maroon", price: 8999, mrp: 11999, rating: 5.0, sold: 18, badge: "EXCLUSIVE" },
];

const OCCASIONS = ["Wedding", "Festive", "Office", "Casual", "Party Wear", "Eid", "Diwali"];

const REVIEWS = [
  { name: "Ananya, Bhubaneswar", text: "The Anarkali fit perfectly after their tailoring team adjusted the sleeves. Feels like a designer piece.", rating: 5 },
  { name: "Riya, Cuttack", text: "Fabric quality is far better than what I expected online. Delivery was on time for my sister's wedding.", rating: 5 },
  { name: "Meher, Puri", text: "Loved the personal styling advice over WhatsApp before I even ordered.", rating: 4 },
];

/* ---------- Placeholder "photography" block ---------- */
function Shot({ label, sub, tone = "beige", className = "" }) {
  const tones = {
    beige: "linear-gradient(160deg, #F8F5F1 0%, #ECE3D6 60%, #E4D4BE 100%)",
    ink: "linear-gradient(160deg, #2b2b2b 0%, #111111 70%)",
    rose: "linear-gradient(160deg, #F6E4E9 0%, #EBC7D1 60%, #D94F70 130%)",
  };
  return (
    <div
      className={`relative flex items-end overflow-hidden ${className}`}
      style={{ background: tones[tone] }}
    >
      <div className="absolute top-3 left-3 w-6 h-6 border-t border-l" style={{ borderColor: COLORS.gold }} />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r" style={{ borderColor: COLORS.gold }} />
      <div className="p-4">
        <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: tone === "ink" ? COLORS.gold : COLORS.gold, fontFamily: "Inter" }}>{sub}</p>
        <p className="text-lg" style={{ fontFamily: "Playfair Display", color: tone === "ink" ? "#fff" : COLORS.ink }}>{label}</p>
      </div>
    </div>
  );
}

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i <= Math.round(rating) ? COLORS.gold : "none"} stroke={COLORS.gold} />
      ))}
    </div>
  );
}

function Badge({ text }) {
  return (
    <span
      className="text-[10px] tracking-[0.14em] uppercase px-2 py-1"
      style={{ fontFamily: "Inter", color: "#fff", background: COLORS.ink }}
    >
      {text}
    </span>
  );
}

/* ---------- Product Card ---------- */
function ProductCard({ p, wishlist, toggleWish, onOpen }) {
  const [hover, setHover] = useState(false);
  const isWish = wishlist.includes(p.id);
  return (
    <div className="group cursor-pointer" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative" onClick={() => onOpen(p)}>
        <Shot label={p.name} sub={p.color} tone={hover ? "ink" : "beige"} className="h-72 w-full transition-all duration-500" />
        <div className="absolute top-3 left-3"><Badge text={p.badge} /></div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleWish(p.id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-110"
        >
          <Heart size={15} fill={isWish ? COLORS.rose : "none"} stroke={isWish ? COLORS.rose : COLORS.ink} />
        </button>
        <div className={`absolute inset-x-0 bottom-0 p-2 flex justify-center transition-all duration-300 ${hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <span className="text-[11px] tracking-widest uppercase bg-white px-4 py-2" style={{ fontFamily: "Inter" }}>Quick View</span>
        </div>
      </div>
      <div className="pt-3">
        <p className="text-[11px] uppercase tracking-wide" style={{ color: COLORS.gold, fontFamily: "Inter" }}>RUBYZ Ensemble</p>
        <p className="text-[15px]" style={{ fontFamily: "Playfair Display", color: COLORS.ink }}>{p.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Stars rating={p.rating} />
          <span className="text-xs text-gray-500" style={{ fontFamily: "Inter" }}>({p.sold})</span>
        </div>
        <div className="flex items-center gap-2 mt-1" style={{ fontFamily: "Poppins" }}>
          <span className="font-semibold" style={{ color: COLORS.ink }}>₹{p.price}</span>
          <span className="text-xs line-through text-gray-400">₹{p.mrp}</span>
          <span className="text-xs" style={{ color: COLORS.rose }}>{Math.round((1 - p.price / p.mrp) * 100)}% OFF</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Nav ---------- */
function NavBar({ view, setView, cartCount, wishCount, setMobileMenu }) {
  const items = ["Women", "Pakistani", "Party Wear", "Luxury", "Wedding", "Tailoring", "Sale"];
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b" style={{ borderColor: "#eee" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-20">
        <button className="lg:hidden" onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
        <button onClick={() => setView("home")} className="text-2xl tracking-wide" style={{ fontFamily: "Playfair Display", color: COLORS.ink }}>
          RUBYZ <span style={{ color: COLORS.gold, fontStyle: "italic" }}>Ensemble</span>
        </button>
        <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-wide uppercase" style={{ fontFamily: "Inter", color: COLORS.ink }}>
          {items.map(i => (
            <button key={i} onClick={() => setView("shop")} className="relative py-2 hover:text-[#B68D40] transition-colors group">
              {i}
              <span className="absolute left-0 -bottom-0.5 w-0 h-[1.5px] group-hover:w-full transition-all" style={{ background: COLORS.gold }} />
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4" style={{ color: COLORS.ink }}>
          <button onClick={() => setView("shop")}><Search size={19} /></button>
          <button onClick={() => setView("about")} className="hidden sm:block"><User size={19} /></button>
          <button className="relative" onClick={() => setView("shop")}>
            <Heart size={19} />
            {wishCount > 0 && <span className="absolute -top-2 -right-2 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: COLORS.rose }}>{wishCount}</span>}
          </button>
          <button className="relative" onClick={() => setView("cart")}>
            <ShoppingBag size={19} />
            {cartCount > 0 && <span className="absolute -top-2 -right-2 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: COLORS.ink }}>{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Home ---------- */
function Home({ setView, wishlist, toggleWish, openProduct }) {
  return (
    <>
      {/* Hero */}
      <section className="grid lg:grid-cols-2 items-stretch">
        <div className="flex flex-col justify-center px-8 lg:px-16 py-20" style={{ background: COLORS.beige }}>
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: COLORS.gold, fontFamily: "Inter" }}>New Festive Collection</p>
          <h1 className="text-5xl lg:text-6xl leading-[1.05] mb-6" style={{ fontFamily: "Playfair Display", color: COLORS.ink }}>
            Luxury Ethnic<br /><span className="italic" style={{ color: COLORS.gold }}>Fashion</span> for Every Occasion
          </h1>
          <p className="max-w-md text-gray-600 mb-8" style={{ fontFamily: "Inter" }}>
            Handpicked designer collections crafted for the modern woman — discover timeless elegance, tailored to you.
          </p>
          <button onClick={() => setView("shop")} className="w-fit px-8 py-4 text-sm tracking-widest uppercase text-white transition-transform hover:scale-[1.02]" style={{ background: COLORS.ink, fontFamily: "Inter" }}>
            Shop Now
          </button>
        </div>
        <Shot label="Handpicked Designer Wear" sub="Festive Edit '26" tone="ink" className="h-80 lg:h-auto w-full" />
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl" style={{ fontFamily: "Playfair Display" }}>Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map(c => (
            <div key={c.name} onClick={() => setView("shop")} className="cursor-pointer group">
              <Shot label={c.name} sub={c.tag} className="h-56 w-full transition-transform duration-500 group-hover:scale-[1.02]" />
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20" style={{ background: COLORS.beige }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: COLORS.gold, fontFamily: "Inter" }}>Fresh In</p>
          <h2 className="text-3xl mb-8" style={{ fontFamily: "Playfair Display" }}>New Arrivals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PRODUCTS.slice(0, 4).map(p => <ProductCard key={p.id} p={p} wishlist={wishlist} toggleWish={toggleWish} onOpen={openProduct} />)}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: COLORS.gold, fontFamily: "Inter" }}>Most Loved</p>
        <h2 className="text-3xl mb-8" style={{ fontFamily: "Playfair Display" }}>Best Sellers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PRODUCTS.slice(4, 8).map(p => <ProductCard key={p.id} p={p} wishlist={wishlist} toggleWish={toggleWish} onOpen={openProduct} />)}
        </div>
      </section>

      {/* Celebrity Inspired */}
      <section className="py-20" style={{ background: COLORS.ink }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: COLORS.gold, fontFamily: "Inter" }}>Editions</p>
          <h2 className="text-3xl mb-8 text-white" style={{ fontFamily: "Playfair Display" }}>Celebrity Inspired</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {["Manish Malhotra", "Sabyasachi"].map(name => (
              <div key={name} className="relative cursor-pointer group" onClick={() => setView("shop")}>
                <Shot label={`Inspired by ${name}`} sub="Explore the Edit" tone="beige" className="h-64 w-full transition-transform duration-500 group-hover:scale-[1.01]" />
                <div className="absolute bottom-5 right-5 flex items-center gap-1 text-sm text-white bg-black/40 px-3 py-1" style={{ fontFamily: "Inter" }}>
                  Explore <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Occasion Shopping */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
        <h2 className="text-3xl mb-8 text-center" style={{ fontFamily: "Playfair Display" }}>Shop by Occasion</h2>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
          {OCCASIONS.map(o => (
            <button key={o} onClick={() => setView("shop")} className="flex flex-col items-center gap-3 py-6 border transition-colors hover:border-[#B68D40]" style={{ borderColor: "#eee" }}>
              <Gem size={20} style={{ color: COLORS.gold }} />
              <span className="text-xs text-center" style={{ fontFamily: "Inter" }}>{o}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-20" style={{ background: COLORS.beige }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Gem, t: "Premium Fabrics" },
            { icon: Scissors, t: "Expert Tailoring" },
            { icon: Check, t: "Handpicked Collections" },
            { icon: Truck, t: "Nationwide Shipping" },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex flex-col items-center gap-3">
              <Icon size={24} style={{ color: COLORS.gold }} />
              <p className="text-sm" style={{ fontFamily: "Inter" }}>{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tailoring */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: COLORS.gold, fontFamily: "Inter" }}>Made for You</p>
          <h2 className="text-3xl mb-4" style={{ fontFamily: "Playfair Display" }}>Custom Tailoring Available</h2>
          <p className="text-gray-600 mb-6" style={{ fontFamily: "Inter" }}>Every piece can be tailored to your measurements — neck, sleeves, length, waist, or fully custom stitching.</p>
          <ul className="grid grid-cols-2 gap-3 mb-8 text-sm" style={{ fontFamily: "Inter" }}>
            {["Neck", "Sleeves", "Length", "Waist", "Custom Stitching"].map(x => (
              <li key={x} className="flex items-center gap-2"><Ruler size={14} style={{ color: COLORS.gold }} />{x}</li>
            ))}
          </ul>
          <button onClick={() => setView("tailoring")} className="px-8 py-4 text-sm tracking-widest uppercase text-white" style={{ background: COLORS.ink, fontFamily: "Inter" }}>Book Tailoring</button>
        </div>
        <Shot label="Tailoring Studio" sub="Bhubaneswar Atelier" className="h-80 w-full" />
      </section>

      {/* Reviews */}
      <section className="py-20" style={{ background: COLORS.beige }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <h2 className="text-3xl mb-8 text-center" style={{ fontFamily: "Playfair Display" }}>Customer Reviews</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map(r => (
              <div key={r.name} className="bg-white p-6">
                <Stars rating={r.rating} />
                <p className="mt-3 text-sm text-gray-700" style={{ fontFamily: "Inter" }}>"{r.text}"</p>
                <p className="mt-4 text-xs uppercase tracking-wide" style={{ color: COLORS.gold, fontFamily: "Inter" }}>{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Gallery */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Instagram size={18} style={{ color: COLORS.rose }} />
          <h2 className="text-2xl" style={{ fontFamily: "Playfair Display" }}>@rubyzensemble</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Shot key={i} label="" sub={`#${i + 1}`} tone={i % 3 === 0 ? "rose" : i % 2 === 0 ? "ink" : "beige"} className="aspect-square w-full" />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16" style={{ background: COLORS.ink }}>
        <div className="max-w-xl mx-auto px-5 text-center">
          <h2 className="text-2xl text-white mb-2" style={{ fontFamily: "Playfair Display" }}>Join Our Fashion Community</h2>
          <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: "Inter" }}>Early access to new collections and styling notes.</p>
          <div className="flex gap-2">
            <input placeholder="Your email" className="flex-1 px-4 py-3 text-sm bg-transparent border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#B68D40]" style={{ fontFamily: "Inter" }} />
            <button className="px-6 py-3 text-xs tracking-widest uppercase" style={{ background: COLORS.gold, color: "#111", fontFamily: "Inter" }}>Subscribe</button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Shop / Listing ---------- */
function Shop({ wishlist, toggleWish, openProduct }) {
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState({ occasion: [], fabric: [] });
  const fabrics = [...new Set(PRODUCTS.map(p => p.fabric))];

  const toggleFilter = (group, val) => {
    setFilters(f => ({
      ...f,
      [group]: f[group].includes(val) ? f[group].filter(v => v !== val) : [...f[group], val],
    }));
  };

  const list = useMemo(() => {
    let out = PRODUCTS.filter(p =>
      (filters.occasion.length === 0 || filters.occasion.includes(p.occasion)) &&
      (filters.fabric.length === 0 || filters.fabric.includes(p.fabric))
    );
    if (sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "popular") out = [...out].sort((a, b) => b.sold - a.sold);
    return out;
  }, [filters, sort]);

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
      <h1 className="text-3xl mb-6" style={{ fontFamily: "Playfair Display" }}>All Products</h1>
      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ fontFamily: "Inter", color: COLORS.gold }}>Occasion</p>
            {OCCASIONS.slice(0, 5).map(o => (
              <label key={o} className="flex items-center gap-2 text-sm mb-2 cursor-pointer" style={{ fontFamily: "Inter" }}>
                <input type="checkbox" checked={filters.occasion.includes(o)} onChange={() => toggleFilter("occasion", o)} />
                {o}
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ fontFamily: "Inter", color: COLORS.gold }}>Fabric</p>
            {fabrics.map(f => (
              <label key={f} className="flex items-center gap-2 text-sm mb-2 cursor-pointer" style={{ fontFamily: "Inter" }}>
                <input type="checkbox" checked={filters.fabric.includes(f)} onChange={() => toggleFilter("fabric", f)} />
                {f}
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ fontFamily: "Inter", color: COLORS.gold }}>Price</p>
            <p className="text-sm text-gray-500" style={{ fontFamily: "Inter" }}>₹1,500 — ₹12,000</p>
            <input type="range" className="w-full accent-[#B68D40]" min="1500" max="12000" />
          </div>
        </aside>
        <div>
          <div className="flex justify-end mb-6">
            <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border px-3 py-2" style={{ fontFamily: "Inter" }}>
              <option value="newest">Newest</option>
              <option value="popular">Popularity</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {list.map(p => <ProductCard key={p.id} p={p} wishlist={wishlist} toggleWish={toggleWish} onOpen={openProduct} />)}
          </div>
          {list.length === 0 && <p className="text-gray-500 text-sm" style={{ fontFamily: "Inter" }}>No products match these filters yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Product Detail ---------- */
function ProductDetail({ product, addToCart, wishlist, toggleWish, setView }) {
  const [accordion, setAccordion] = useState("Description");
  const [thumb, setThumb] = useState(0);
  if (!product) return null;
  const isWish = wishlist.includes(product.id);
  const sections = {
    Description: `A handcrafted ${product.fabric.toLowerCase()} piece designed for ${product.occasion.toLowerCase()} occasions, finished with fine embroidery detail.`,
    Fabric: `${product.fabric}, breathable and pre-washed for shape retention.`,
    Care: "Dry clean only. Store folded in muslin cloth away from direct sunlight.",
    Shipping: "Dispatched within 2–3 business days. Free store pickup available.",
    Returns: "7-day exchange on unworn pieces with tags intact.",
    Tailoring: "Complimentary alteration on neck, sleeve, and length for this piece.",
  };
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
      <button onClick={() => setView("shop")} className="text-sm flex items-center gap-1 mb-6 text-gray-500" style={{ fontFamily: "Inter" }}><ChevronLeft size={14} /> Back to Shop</button>
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <Shot label={product.name} sub={product.color} tone="beige" className="h-[480px] w-full mb-3" />
          <div className="flex gap-2">
            {[0,1,2,3].map(i => (
              <button key={i} onClick={() => setThumb(i)} className={`w-16 h-16 border ${thumb === i ? "border-[#B68D40]" : "border-transparent"}`}>
                <Shot label="" sub={`${i+1}`} className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: COLORS.gold, fontFamily: "Inter" }}>{product.cat}</p>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "Playfair Display" }}>{product.name}</h1>
          <Stars rating={product.rating} />
          <div className="flex items-center gap-3 mt-4" style={{ fontFamily: "Poppins" }}>
            <span className="text-2xl font-semibold">₹{product.price}</span>
            <span className="text-sm line-through text-gray-400">₹{product.mrp}</span>
            <span className="text-sm" style={{ color: COLORS.rose }}>{Math.round((1 - product.price / product.mrp) * 100)}% OFF</span>
          </div>
          <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: "Inter" }}>Inclusive of all taxes</p>

          <div className="flex gap-3 mt-8">
            <button onClick={() => addToCart(product)} className="flex-1 py-4 text-sm tracking-widest uppercase border" style={{ borderColor: COLORS.ink, fontFamily: "Inter" }}>Add to Cart</button>
            <button onClick={() => { addToCart(product); setView("cart"); }} className="flex-1 py-4 text-sm tracking-widest uppercase text-white" style={{ background: COLORS.ink, fontFamily: "Inter" }}>Buy Now</button>
            <button onClick={() => toggleWish(product.id)} className="w-14 flex items-center justify-center border" style={{ borderColor: "#ddd" }}>
              <Heart size={17} fill={isWish ? COLORS.rose : "none"} stroke={isWish ? COLORS.rose : COLORS.ink} />
            </button>
          </div>
          <button className="w-full mt-3 py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2 text-white" style={{ background: "#25D366", fontFamily: "Inter" }}>
            <MessageCircle size={16} /> WhatsApp Inquiry
          </button>

          <div className="mt-10 border-t" style={{ borderColor: "#eee" }}>
            {Object.keys(sections).map(key => (
              <div key={key} className="border-b" style={{ borderColor: "#eee" }}>
                <button onClick={() => setAccordion(accordion === key ? "" : key)} className="w-full flex justify-between items-center py-4 text-sm" style={{ fontFamily: "Inter" }}>
                  {key}
                  <ChevronDown size={15} className={`transition-transform ${accordion === key ? "rotate-180" : ""}`} />
                </button>
                {accordion === key && <p className="pb-4 text-sm text-gray-600" style={{ fontFamily: "Inter" }}>{sections[key]}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl mb-6" style={{ fontFamily: "Playfair Display" }}>Complete the Look</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PRODUCTS.filter(p => p.id !== product.id).slice(0, 4).map(p => (
            <ProductCard key={p.id} p={p} wishlist={wishlist} toggleWish={toggleWish} onOpen={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Cart ---------- */
function Cart({ cart, updateQty, removeItem, setView }) {
  const [delivery, setDelivery] = useState("pickup");
  const [coupon, setCoupon] = useState("");
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = delivery === "delivery" ? 80 : 0;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <ShoppingBag size={40} className="mx-auto mb-4" style={{ color: COLORS.gold }} />
        <h2 className="text-2xl mb-2" style={{ fontFamily: "Playfair Display" }}>Your cart is empty</h2>
        <p className="text-gray-500 mb-6" style={{ fontFamily: "Inter" }}>Explore the collection and find something you love.</p>
        <button onClick={() => setView("shop")} className="px-8 py-3 text-sm uppercase tracking-widest text-white" style={{ background: COLORS.ink, fontFamily: "Inter" }}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-12 grid lg:grid-cols-[1fr_360px] gap-10">
      <div>
        <h1 className="text-3xl mb-6" style={{ fontFamily: "Playfair Display" }}>Shopping Bag</h1>
        <div className="space-y-6">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 border-b pb-6" style={{ borderColor: "#eee" }}>
              <Shot label="" sub={item.color} className="w-24 h-28 shrink-0" />
              <div className="flex-1">
                <p style={{ fontFamily: "Playfair Display" }}>{item.name}</p>
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Inter" }}>{item.fabric} · {item.occasion}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 border flex items-center justify-center"><Minus size={12} /></button>
                  <span className="text-sm w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 border flex items-center justify-center"><Plus size={12} /></button>
                  <button onClick={() => removeItem(item.id)} className="ml-4 text-xs text-gray-400 hover:text-[#D94F70]" style={{ fontFamily: "Inter" }}>Remove</button>
                </div>
              </div>
              <p style={{ fontFamily: "Poppins" }}>₹{item.price * item.qty}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 h-fit" style={{ background: COLORS.beige }}>
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: COLORS.gold, fontFamily: "Inter" }}>Delivery Method</p>
        <label className="flex items-center justify-between text-sm mb-2 cursor-pointer" style={{ fontFamily: "Inter" }}>
          <span className="flex items-center gap-2"><input type="radio" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} /> Pickup from Store</span>
          <span>Free</span>
        </label>
        <label className="flex items-center justify-between text-sm mb-6 cursor-pointer" style={{ fontFamily: "Inter" }}>
          <span className="flex items-center gap-2"><input type="radio" checked={delivery === "delivery"} onChange={() => setDelivery("delivery")} /> Home Delivery</span>
          <span>₹80</span>
        </label>

        <div className="flex gap-2 mb-6">
          <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 px-3 py-2 text-sm border" style={{ fontFamily: "Inter" }} />
          <button className="px-4 text-xs uppercase tracking-wide border" style={{ borderColor: COLORS.ink, fontFamily: "Inter" }}>Apply</button>
        </div>

        <div className="space-y-2 text-sm border-t pt-4" style={{ borderColor: "#e5ddd0", fontFamily: "Inter" }}>
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span>{delivery === "delivery" ? "Delivery" : "Pickup"}</span><span>{shipping ? `₹${shipping}` : "Free"}</span></div>
          <div className="flex justify-between text-base pt-2 border-t" style={{ borderColor: "#e5ddd0", fontFamily: "Poppins" }}><span>Total</span><span>₹{total}</span></div>
        </div>
        <button className="w-full mt-6 py-4 text-sm tracking-widest uppercase text-white" style={{ background: COLORS.ink, fontFamily: "Inter" }}>Checkout</button>
      </div>
    </div>
  );
}

/* ---------- Tailoring ---------- */
function Tailoring() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-20 text-center">
      <Scissors size={30} className="mx-auto mb-4" style={{ color: COLORS.gold }} />
      <h1 className="text-4xl mb-4" style={{ fontFamily: "Playfair Display" }}>Book Tailoring Consultation</h1>
      <p className="text-gray-600 mb-10" style={{ fontFamily: "Inter" }}>Tell us what you need altered and our in-store tailor will reach out to confirm your appointment.</p>
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <input placeholder="Full name" className="border px-4 py-3 text-sm" style={{ fontFamily: "Inter" }} />
        <input placeholder="Phone number" className="border px-4 py-3 text-sm" style={{ fontFamily: "Inter" }} />
        <select className="border px-4 py-3 text-sm sm:col-span-2" style={{ fontFamily: "Inter" }}>
          <option>Alteration type: Neck</option>
          <option>Alteration type: Sleeves</option>
          <option>Alteration type: Length</option>
          <option>Alteration type: Waist</option>
          <option>Custom Stitching</option>
        </select>
        <textarea placeholder="Notes for the tailor" className="border px-4 py-3 text-sm sm:col-span-2" rows={3} style={{ fontFamily: "Inter" }} />
      </div>
      <button className="mt-8 px-10 py-4 text-sm tracking-widest uppercase text-white" style={{ background: COLORS.ink, fontFamily: "Inter" }}>Book Consultation</button>
    </div>
  );
}

/* ---------- About ---------- */
function About() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20">
      <p className="text-xs tracking-[0.3em] uppercase mb-3 text-center" style={{ color: COLORS.gold, fontFamily: "Inter" }}>Our Story</p>
      <h1 className="text-4xl text-center mb-8" style={{ fontFamily: "Playfair Display" }}>From a Bhubaneswar Boutique to a Fashion House</h1>
      <Shot label="RUBYZ Ensemble Atelier" sub="Bhubaneswar" tone="ink" className="h-72 w-full mb-10" />
      <p className="text-gray-600 leading-relaxed mb-4" style={{ fontFamily: "Inter" }}>
        RUBYZ Ensemble began as a small curated collection shared with a close circle of customers, and has grown into a
        destination for premium ethnic wear across Odisha. Every piece is handpicked, and every fit is refined in-house
        by our tailoring team.
      </p>
      <div className="grid sm:grid-cols-3 gap-6 mt-10">
        <div className="flex items-start gap-3"><MapPin size={18} style={{ color: COLORS.gold }} /><p className="text-sm" style={{ fontFamily: "Inter" }}>Bhubaneswar, Odisha</p></div>
        <div className="flex items-start gap-3"><Phone size={18} style={{ color: COLORS.gold }} /><p className="text-sm" style={{ fontFamily: "Inter" }}>+91 90000 00000</p></div>
        <div className="flex items-start gap-3"><Mail size={18} style={{ color: COLORS.gold }} /><p className="text-sm" style={{ fontFamily: "Inter" }}>hello@rubyzensemble.com</p></div>
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="pt-16 pb-8" style={{ background: COLORS.ink }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 grid sm:grid-cols-4 gap-8 text-sm text-gray-400" style={{ fontFamily: "Inter" }}>
        <div>
          <p className="text-xl mb-3 text-white" style={{ fontFamily: "Playfair Display" }}>RUBYZ Ensemble</p>
          <p>Luxury Ethnic Fashion for Every Occasion.</p>
        </div>
        <div><p className="text-white mb-3">Shop</p><p>Pakistani Suits</p><p>Party Wear</p><p>Wedding</p><p>Sale</p></div>
        <div><p className="text-white mb-3">Customer Service</p><p>Track Order</p><p>Returns</p><p>Tailoring</p><p>FAQs</p></div>
        <div><p className="text-white mb-3">Contact</p><p>Bhubaneswar, Odisha</p><p>+91 90000 00000</p><p>hello@rubyzensemble.com</p></div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-10" style={{ fontFamily: "Inter" }}>© 2026 RUBYZ Ensemble. All rights reserved. (Demo storefront — static content)</p>
    </footer>
  );
}

/* ---------- Root ---------- */
export default function RubyzStorefront() {
  const [view, setView] = useState("home");
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeProduct, setActiveProduct] = useState(PRODUCTS[0]);
  const [mobileMenu, setMobileMenu] = useState(false);

  const toggleWish = (id) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  const openProduct = (p) => { setActiveProduct(p); setView("product"); window.scrollTo?.(0,0); };
  const addToCart = (p) => setCart(c => {
    const existing = c.find(i => i.id === p.id);
    if (existing) return c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...c, { ...p, qty: 1 }];
  });
  const updateQty = (id, d) => setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const removeItem = (id) => setCart(c => c.filter(i => i.id !== id));

  return (
    <div style={{ fontFamily: "Inter", color: COLORS.ink, background: COLORS.bg }} className="min-h-screen pb-16 lg:pb-0">
      <style>{FONT_IMPORT}</style>
      <NavBar view={view} setView={setView} cartCount={cart.length} wishCount={wishlist.length} setMobileMenu={setMobileMenu} />

      {mobileMenu && (
        <div className="fixed inset-0 z-50 bg-white p-6" >
          <button onClick={() => setMobileMenu(false)} className="mb-8"><X size={22} /></button>
          <nav className="flex flex-col gap-5 text-lg" style={{ fontFamily: "Playfair Display" }}>
            {["home","shop","tailoring","about","cart"].map(v => (
              <button key={v} onClick={() => { setView(v); setMobileMenu(false); }} className="text-left capitalize">{v}</button>
            ))}
          </nav>
        </div>
      )}

      {view === "home" && <Home setView={setView} wishlist={wishlist} toggleWish={toggleWish} openProduct={openProduct} />}
      {view === "shop" && <Shop wishlist={wishlist} toggleWish={toggleWish} openProduct={openProduct} />}
      {view === "product" && <ProductDetail product={activeProduct} addToCart={addToCart} wishlist={wishlist} toggleWish={toggleWish} setView={setView} />}
      {view === "cart" && <Cart cart={cart} updateQty={updateQty} removeItem={removeItem} setView={setView} />}
      {view === "tailoring" && <Tailoring />}
      {view === "about" && <About />}

      <Footer />

      {/* Floating WhatsApp */}
      <a className="fixed bottom-20 lg:bottom-6 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30" style={{ background: "#25D366" }}>
        <MessageCircle size={20} color="#fff" />
      </a>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 inset-x-0 lg:hidden bg-white border-t flex justify-around py-2 z-30" style={{ borderColor: "#eee" }}>
        {[
          { icon: Menu, label: "Home", v: "home" },
          { icon: Search, label: "Shop", v: "shop" },
          { icon: Heart, label: "Wishlist", v: "shop" },
          { icon: User, label: "Profile", v: "about" },
        ].map(({ icon: Icon, label, v }) => (
          <button key={label} onClick={() => setView(v)} className="flex flex-col items-center gap-1 text-[10px]" style={{ fontFamily: "Inter", color: COLORS.ink }}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}
