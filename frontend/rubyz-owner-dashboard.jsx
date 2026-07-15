import React, { useState } from "react";
import {
  LayoutGrid, Package, ClipboardList, Boxes, Users, BarChart3, Ticket, Layout, Settings,
  Plus, Bell, ChevronRight, ChevronLeft, Check, X, Mic, Camera, FileSpreadsheet, Truck,
  AlertTriangle, Search, Menu, Sparkles, Save
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* Same brand tokens as the customer storefront, adapted for a working dashboard */
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400&family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600&display=swap');`;
const C = { ink: "#111111", gold: "#B68D40", beige: "#F8F5F1", rose: "#D94F70", bg: "#FBFAF8" };

/* ---------- Mock data ---------- */
const NAV = [
  { id: "home", label: "Dashboard", icon: LayoutGrid },
  { id: "add", label: "Add Product", icon: Plus },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "customers", label: "Customers", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "homepage", label: "Homepage Editor", icon: Layout },
];

const ORDERS = [
  { id: "#235", name: "Riya Sharma", amount: 3299, mode: "Delivery", status: "Pending", phone: "98xxxxxx21", items: "Rose Embroidered Anarkali x1" },
  { id: "#234", name: "Ananya Das", amount: 6999, mode: "Pickup", status: "Packed", phone: "97xxxxxx08", items: "Champagne Zardozi Set x1" },
  { id: "#233", name: "Meher Iqbal", amount: 1899, mode: "Delivery", status: "Out for Delivery", phone: "99xxxxxx45", items: "Sky Cotton Co-ord x1" },
  { id: "#232", name: "Kavya Patnaik", amount: 8999, mode: "Pickup", status: "Delivered", phone: "96xxxxxx77", items: "Sabyasachi Inspired Lehenga x1" },
  { id: "#231", name: "Sneha Rout", amount: 4299, mode: "Delivery", status: "Delivered", phone: "90xxxxxx19", items: "Emerald Sequin Sharara x1" },
];

const INVENTORY = [
  { name: "Rose Embroidered Anarkali", stock: 8 },
  { name: "Champagne Zardozi Kurta Set", stock: 2 },
  { name: "Ivory Chikankari Suit", stock: 14 },
  { name: "Emerald Sequin Sharara", stock: 1 },
  { name: "Blush Organza Saree", stock: 6 },
  { name: "Sabyasachi Inspired Lehenga", stock: 3 },
];

const REVENUE = [
  { day: "Mon", revenue: 12500 }, { day: "Tue", revenue: 18200 }, { day: "Wed", revenue: 9800 },
  { day: "Thu", revenue: 21000 }, { day: "Fri", revenue: 26500 }, { day: "Sat", revenue: 34200 }, { day: "Sun", revenue: 29800 },
];

const AI_TAGS = ["Pakistani Suit", "Pink", "Party Wear", "Embroidery", "Cotton", "Summer Collection"];

const STATUS_FLOW = ["Pending", "Packed", "Out for Delivery", "Delivered"];
const statusColor = (s) => ({
  Pending: "#B68D40", Packed: "#5B7FBA", "Out for Delivery": "#D94F70", Delivered: "#3A9D5D", Rejected: "#999",
}[s] || "#999");

/* ---------- small ui bits ---------- */
function StatCard({ label, value, tone = "ink", icon: Icon }) {
  return (
    <div className="bg-white p-5 border" style={{ borderColor: "#eee" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: "Inter" }}>{label}</p>
        {Icon && <Icon size={16} style={{ color: C.gold }} />}
      </div>
      <p className="text-2xl" style={{ fontFamily: "Poppins", color: tone === "rose" ? C.rose : C.ink }}>{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-full text-white" style={{ background: statusColor(status), fontFamily: "Inter" }}>
      {status}
    </span>
  );
}

/* ---------- Dashboard Home ---------- */
function DashboardHome({ setActive }) {
  const lowStock = INVENTORY.filter(i => i.stock <= 2);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl mb-1" style={{ fontFamily: "Playfair Display" }}>Good morning, Tamanna 👋</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "Inter" }}>Here's how the boutique is doing today.</p>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-[#FDF3E7] border" style={{ borderColor: "#EFD9B0" }}>
          <AlertTriangle size={18} style={{ color: C.gold }} />
          <p className="text-sm" style={{ fontFamily: "Inter" }}>
            <strong>{lowStock.length} product{lowStock.length > 1 ? "s" : ""}</strong> running low on stock — {lowStock.map(l => l.name).join(", ")}.
          </p>
          <button onClick={() => setActive("inventory")} className="ml-auto text-xs uppercase tracking-wide underline" style={{ fontFamily: "Inter" }}>View</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Orders" value="12" icon={ClipboardList} />
        <StatCard label="Pending Orders" value="3" tone="rose" icon={AlertTriangle} />
        <StatCard label="Completed Orders" value="9" icon={Check} />
        <StatCard label="Revenue Today" value="₹34,200" icon={BarChart3} />
        <StatCard label="Pickup Orders" value="5" icon={Boxes} />
        <StatCard label="Delivery Orders" value="7" icon={Truck} />
        <StatCard label="Low Stock Items" value={lowStock.length} tone="rose" icon={AlertTriangle} />
        <StatCard label="Repeat Customers" value="4" icon={Users} />
      </div>

      <div className="bg-white border p-5" style={{ borderColor: "#eee" }}>
        <p className="text-sm mb-4" style={{ fontFamily: "Inter", color: "#555" }}>Revenue — Last 7 Days</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={REVENUE}>
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="revenue" fill={C.gold} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={() => setActive("add")} className="flex items-center justify-between p-5 text-white" style={{ background: C.ink, fontFamily: "Inter" }}>
          <span>+ Add a new product, Instagram-style</span> <ChevronRight size={16} />
        </button>
        <button onClick={() => setActive("orders")} className="flex items-center justify-between p-5 border" style={{ borderColor: C.ink, fontFamily: "Inter" }}>
          <span>Export today's orders to Excel</span> <FileSpreadsheet size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Add Product — Instagram-style stepper ---------- */
function AddProduct() {
  const [step, setStep] = useState(1);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({ title: "", price: "", stock: "", description: "" });
  const [voiceListening, setVoiceListening] = useState(false);
  const [saved, setSaved] = useState(false);

  const runAI = () => {
    setPhotoAdded(true);
    setAnalyzing(true);
    setTimeout(() => {
      setTags(AI_TAGS);
      setAnalyzing(false);
      setForm(f => ({ ...f, title: "Pink Embroidered Pakistani Suit" }));
    }, 1400);
  };

  const useVoice = () => {
    setVoiceListening(true);
    setTimeout(() => {
      setVoiceListening(false);
      setForm(f => ({ ...f, description: "A soft pink Pakistani suit with hand embroidery, perfect for daytime festive wear. Lightweight cotton, comfortable all-day fit." }));
    }, 1600);
  };

  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const steps = ["Photo", "AI Tags", "Details", "Publish"];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl mb-1" style={{ fontFamily: "Playfair Display" }}>Add a Product</h1>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "Inter" }}>Just like posting on Instagram — add a photo, and we'll help with the rest.</p>

      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-xs ${step >= i + 1 ? "" : "opacity-40"}`} style={{ fontFamily: "Inter" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: step >= i + 1 ? C.ink : "#ccc" }}>{i + 1}</span>
              {s}
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="border-2 border-dashed p-12 text-center" style={{ borderColor: "#ddd" }}>
          {!photoAdded ? (
            <>
              <Camera size={30} className="mx-auto mb-4" style={{ color: C.gold }} />
              <p className="text-sm mb-4" style={{ fontFamily: "Inter" }}>Tap to add a photo of the outfit</p>
              <button onClick={runAI} className="px-6 py-3 text-sm text-white" style={{ background: C.ink, fontFamily: "Inter" }}>Choose Photo</button>
            </>
          ) : analyzing ? (
            <div className="flex flex-col items-center gap-3">
              <Sparkles size={24} className="animate-pulse" style={{ color: C.gold }} />
              <p className="text-sm" style={{ fontFamily: "Inter" }}>Reading the photo and suggesting tags…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-40 h-52" style={{ background: "linear-gradient(160deg,#F8F5F1,#E4D4BE)" }} />
              <button onClick={() => setStep(2)} className="px-6 py-3 text-sm text-white mt-2" style={{ background: C.ink, fontFamily: "Inter" }}>Continue</button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: C.gold }} />
            <p className="text-sm" style={{ fontFamily: "Inter" }}>Our AI suggested these tags from your photo — remove anything that's not right.</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-2 px-3 py-2 text-sm" style={{ background: C.beige, fontFamily: "Inter" }}>
                {t} <button onClick={() => removeTag(t)}><X size={12} /></button>
              </span>
            ))}
            {tags.length === 0 && <p className="text-sm text-gray-400" style={{ fontFamily: "Inter" }}>No tags left — you can add your own in the next step.</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 text-sm border flex items-center gap-2" style={{ fontFamily: "Inter" }}><ChevronLeft size={14} /> Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-3 text-sm text-white" style={{ background: C.ink, fontFamily: "Inter" }}>Looks Good</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: "Inter" }}>Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border px-3 py-3 text-sm mt-1" style={{ fontFamily: "Inter" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: "Inter" }}>Price (₹)</label>
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="2999" className="w-full border px-3 py-3 text-sm mt-1" style={{ fontFamily: "Inter" }} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: "Inter" }}>Stock</label>
              <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="10" className="w-full border px-3 py-3 text-sm mt-1" style={{ fontFamily: "Inter" }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mt-1 mb-1">
              <label className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: "Inter" }}>Description</label>
              <button onClick={useVoice} className="flex items-center gap-1 text-xs px-3 py-1.5" style={{ background: voiceListening ? C.rose : C.beige, color: voiceListening ? "#fff" : C.ink, fontFamily: "Inter" }}>
                <Mic size={12} /> {voiceListening ? "Listening…" : "Speak in Hindi or English"}
              </button>
            </div>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full border px-3 py-3 text-sm" style={{ fontFamily: "Inter" }} placeholder="Describe the outfit, or tap the mic to speak it instead." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="px-6 py-3 text-sm border flex items-center gap-2" style={{ fontFamily: "Inter" }}><ChevronLeft size={14} /> Back</button>
            <button onClick={() => setSaved(true)} className="px-6 py-3 text-sm flex items-center gap-2" style={{ background: C.beige, fontFamily: "Inter" }}><Save size={14} /> Save as Draft</button>
            <button onClick={() => setStep(4)} className="px-6 py-3 text-sm text-white ml-auto" style={{ background: C.ink, fontFamily: "Inter" }}>Continue</button>
          </div>
          {saved && <p className="text-xs text-gray-500" style={{ fontFamily: "Inter" }}>Saved to Drafts — you can finish this later.</p>}
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-10">
          <Check size={36} className="mx-auto mb-4" style={{ color: "#3A9D5D" }} />
          <h2 className="text-xl mb-2" style={{ fontFamily: "Playfair Display" }}>Ready to Publish</h2>
          <p className="text-sm text-gray-500 mb-8" style={{ fontFamily: "Inter" }}>"{form.title || "Pink Embroidered Pakistani Suit"}" will go live on the storefront instantly.</p>
          <button onClick={() => setStep(1) || setPhotoAdded(false) || setTags([])} className="px-8 py-4 text-sm text-white" style={{ background: C.ink, fontFamily: "Inter" }}>Publish Product</button>
        </div>
      )}

      <div className="mt-10 pt-6 border-t text-sm text-gray-500" style={{ borderColor: "#eee", fontFamily: "Inter" }}>
        Prefer uploading many products at once? <button className="underline">Bulk upload from Excel</button>
      </div>
    </div>
  );
}

/* ---------- Orders ---------- */
function Orders() {
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState(ORDERS);
  const [exported, setExported] = useState(false);

  const advance = (id) => {
    setOrders(orders.map(o => {
      if (o.id !== id) return o;
      const idx = STATUS_FLOW.indexOf(o.status);
      const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
      return { ...o, status: next };
    }));
  };
  const reject = (id) => setOrders(orders.map(o => o.id === id ? { ...o, status: "Rejected" } : o));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl mb-1" style={{ fontFamily: "Playfair Display" }}>Orders</h1>
          <p className="text-sm text-gray-500" style={{ fontFamily: "Inter" }}>Every order from the storefront appears here automatically.</p>
        </div>
        <button onClick={() => setExported(true)} className="flex items-center gap-2 px-5 py-3 text-sm text-white" style={{ background: C.ink, fontFamily: "Inter" }}>
          <FileSpreadsheet size={15} /> Export to Excel
        </button>
      </div>
      {exported && <div className="mb-4 p-3 text-sm bg-[#EAF6EE] text-[#3A9D5D]" style={{ fontFamily: "Inter" }}>orders.xlsx generated — also synced automatically to your Google Sheet.</div>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border" style={{ borderColor: "#eee" }}>
          <table className="w-full text-sm" style={{ fontFamily: "Inter" }}>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b" style={{ borderColor: "#eee" }}>
                <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Amount</th><th className="p-3">Mode</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer hover:bg-[#FBFAF8] border-b" style={{ borderColor: "#f3f3f3" }}>
                  <td className="p-3">{o.id}</td>
                  <td className="p-3">{o.name}</td>
                  <td className="p-3" style={{ fontFamily: "Poppins" }}>₹{o.amount}</td>
                  <td className="p-3">{o.mode}</td>
                  <td className="p-3"><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border p-5 h-fit" style={{ borderColor: "#eee" }}>
          {!selected ? (
            <p className="text-sm text-gray-400" style={{ fontFamily: "Inter" }}>Select an order to see details.</p>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg" style={{ fontFamily: "Playfair Display" }}>{selected.id}</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "Inter" }}>{selected.name} · {selected.phone}</p>
                </div>
                <StatusPill status={orders.find(o => o.id === selected.id)?.status} />
              </div>
              <p className="text-sm mb-1" style={{ fontFamily: "Inter" }}><strong>Items:</strong> {selected.items}</p>
              <p className="text-sm mb-1" style={{ fontFamily: "Inter" }}><strong>Mode:</strong> {selected.mode}</p>
              <p className="text-sm mb-4" style={{ fontFamily: "Inter" }}><strong>Total:</strong> ₹{selected.amount}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => advance(selected.id)} className="px-4 py-2 text-xs text-white" style={{ background: C.ink, fontFamily: "Inter" }}>Advance Status</button>
                <button onClick={() => reject(selected.id)} className="px-4 py-2 text-xs border" style={{ borderColor: C.rose, color: C.rose, fontFamily: "Inter" }}>Reject</button>
              </div>

              {selected.mode === "Delivery" && (
                <div className="pt-4 border-t" style={{ borderColor: "#eee" }}>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: "Inter" }}>Book with a delivery partner</p>
                  <div className="flex flex-wrap gap-2">
                    {["Ekart", "Uber Parcel", "Porter", "Delhivery"].map(p => (
                      <button key={p} className="flex items-center gap-1 px-3 py-2 text-xs border" style={{ fontFamily: "Inter" }}>
                        <Truck size={12} /> {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Inventory ---------- */
function Inventory() {
  return (
    <div>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "Playfair Display" }}>Inventory</h1>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "Inter" }}>Stock updates automatically every time an order comes in.</p>
      <div className="bg-white border divide-y" style={{ borderColor: "#eee" }}>
        {INVENTORY.map(i => (
          <div key={i.name} className="flex items-center justify-between p-4">
            <p className="text-sm" style={{ fontFamily: "Inter" }}>{i.name}</p>
            <div className="flex items-center gap-3">
              {i.stock <= 2 && <span className="flex items-center gap-1 text-xs" style={{ color: C.rose, fontFamily: "Inter" }}><AlertTriangle size={12} /> Low Stock</span>}
              <span className="text-sm w-10 text-right" style={{ fontFamily: "Poppins" }}>{i.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Customers ---------- */
function Customers() {
  const top = [
    { name: "Kavya Patnaik", orders: 6, spend: 32400 },
    { name: "Sneha Rout", orders: 4, spend: 21200 },
    { name: "Riya Sharma", orders: 3, spend: 15800 },
  ];
  return (
    <div>
      <h1 className="text-2xl mb-6" style={{ fontFamily: "Playfair Display" }}>Customers</h1>
      <div className="bg-white border" style={{ borderColor: "#eee" }}>
        <table className="w-full text-sm" style={{ fontFamily: "Inter" }}>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b" style={{ borderColor: "#eee" }}>
              <th className="p-3">Customer</th><th className="p-3">Orders</th><th className="p-3">Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {top.map(c => (
              <tr key={c.name} className="border-b" style={{ borderColor: "#f3f3f3" }}>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.orders}</td>
                <td className="p-3" style={{ fontFamily: "Poppins" }}>₹{c.spend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Analytics ---------- */
function Analytics() {
  const topProducts = [
    { name: "Rose Embroidered Anarkali", views: 412, orders: 28 },
    { name: "Sabyasachi Inspired Lehenga", views: 388, orders: 18 },
    { name: "Sky Cotton Co-ord Set", views: 301, orders: 24 },
  ];
  return (
    <div className="space-y-8">
      <h1 className="text-2xl" style={{ fontFamily: "Playfair Display" }}>Analytics</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="This Week" value="₹1,52,400" />
        <StatCard label="This Month" value="₹6,12,900" />
        <StatCard label="Top Category" value="Pakistani Suits" />
      </div>
      <div className="bg-white border p-5" style={{ borderColor: "#eee" }}>
        <p className="text-sm mb-4 text-gray-500" style={{ fontFamily: "Inter" }}>Top Products</p>
        {topProducts.map(p => (
          <div key={p.name} className="flex justify-between items-center py-2 border-b text-sm" style={{ borderColor: "#f3f3f3", fontFamily: "Inter" }}>
            <span>{p.name}</span>
            <span className="text-gray-500">{p.views} views · {p.orders} orders</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Coupons ---------- */
function Coupons() {
  const list = ["WELCOME10", "SUMMER15", "FESTIVE20"];
  return (
    <div>
      <h1 className="text-2xl mb-6" style={{ fontFamily: "Playfair Display" }}>Coupons</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        {list.map(c => (
          <span key={c} className="px-4 py-2 text-sm" style={{ background: C.beige, fontFamily: "Inter" }}>{c}</span>
        ))}
      </div>
      <button className="px-5 py-3 text-sm text-white flex items-center gap-2" style={{ background: C.ink, fontFamily: "Inter" }}><Plus size={14} /> Create Coupon</button>
    </div>
  );
}

/* ---------- Homepage Editor ---------- */
function HomepageEditor() {
  const [toggles, setToggles] = useState({ banner: true, festiveEdit: true, offers: false, categories: true });
  return (
    <div>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "Playfair Display" }}>Homepage Editor</h1>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "Inter" }}>Turn homepage sections on or off — no coding needed.</p>
      <div className="bg-white border divide-y" style={{ borderColor: "#eee" }}>
        {Object.entries(toggles).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between p-4">
            <span className="text-sm capitalize" style={{ fontFamily: "Inter" }}>{key.replace(/([A-Z])/g, " $1")}</span>
            <button onClick={() => setToggles({ ...toggles, [key]: !val })} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: val ? C.ink : "#ddd" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: val ? 22 : 2 }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
export default function RubyzOwnerDashboard() {
  const [active, setActive] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PAGES = {
    home: <DashboardHome setActive={setActive} />,
    add: <AddProduct />,
    orders: <Orders />,
    inventory: <Inventory />,
    customers: <Customers />,
    analytics: <Analytics />,
    coupons: <Coupons />,
    homepage: <HomepageEditor />,
  };

  return (
    <div style={{ fontFamily: "Inter", background: C.bg, color: C.ink }} className="min-h-screen flex">
      <style>{FONT_IMPORT}</style>

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-white border-r transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ borderColor: "#eee" }}>
        <div className="p-6 flex items-center justify-between">
          <p className="text-xl" style={{ fontFamily: "Playfair Display" }}>RUBYZ <span className="italic" style={{ color: C.gold }}>Studio</span></p>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="px-3 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActive(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-md transition-colors ${active === id ? "text-white" : "text-gray-600 hover:bg-[#F8F5F1]"}`}
              style={{ background: active === id ? C.ink : "transparent", fontFamily: "Inter" }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-600 hover:bg-[#F8F5F1] rounded-md" style={{ fontFamily: "Inter" }}>
            <Settings size={16} /> Settings
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b sticky top-0 z-30 flex items-center justify-between px-5 py-4" style={{ borderColor: "#eee" }}>
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border w-72" style={{ borderColor: "#eee" }}>
            <Search size={14} className="text-gray-400" />
            <input placeholder="Search orders, products…" className="text-sm outline-none w-full" style={{ fontFamily: "Inter" }} />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative"><Bell size={18} /><span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center text-white" style={{ background: C.rose }}>3</span></button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white" style={{ background: C.gold }}>T</div>
          </div>
        </header>
        <main className="p-6 lg:p-8">{PAGES[active]}</main>
      </div>
    </div>
  );
}
