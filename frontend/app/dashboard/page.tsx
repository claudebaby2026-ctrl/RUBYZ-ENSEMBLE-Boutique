"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, Boxes, Check, ClipboardList, LayoutGrid, Plus, Ticket, Users, Layout, ChevronRight, FileSpreadsheet, Save, Sparkles, X, Mic, Camera, ChevronLeft, Truck, Search } from "lucide-react";

const C = { ink: "#111111", gold: "#B68D40", beige: "#F8F5F1", rose: "#D94F70", bg: "#FBFAF8" };

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
];

const INVENTORY = [
  { name: "Rose Embroidered Anarkali", stock: 8 },
  { name: "Champagne Zardozi Kurta Set", stock: 2 },
  { name: "Emerald Sequin Sharara", stock: 1 },
  { name: "Blush Organza Saree", stock: 6 },
];

function StatCard({ label, value, tone = "ink", icon: Icon }: any) {
  return (
    <div className="rounded-[1.2rem] border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{label}</p>
        {Icon && <Icon size={16} className="text-[#B68D40]" />}
      </div>
      <p className={`text-2xl ${tone === "rose" ? "text-[#D94F70]" : "text-[#111111]"}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const bg = {
    Pending: "#B68D40",
    Packed: "#5B7FBA",
    "Out for Delivery": "#D94F70",
    Delivered: "#3A9D5D",
    Rejected: "#999",
  }[status] || "#999";

  return <span className="rounded-full px-2.5 py-1 text-[11px] text-white" style={{ background: bg }}>{status}</span>;
}

function DashboardHome({ setActive }: { setActive: (id: string) => void }) {
  const lowStock = INVENTORY.filter((item) => item.stock <= 2);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Good morning, Tamanna 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Here is how the boutique is performing today.</p>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 rounded-[1.2rem] border border-[#EFD9B0] bg-[#FDF3E7] p-4">
          <AlertTriangle size={18} className="text-[#B68D40]" />
          <p className="text-sm text-[#111111]"><strong>{lowStock.length} product(s)</strong> are running low on stock.</p>
          <button onClick={() => setActive("inventory")} className="ml-auto text-xs uppercase tracking-[0.24em] underline">View</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Orders" value="12" icon={ClipboardList} />
        <StatCard label="Pending Orders" value="3" tone="rose" icon={AlertTriangle} />
        <StatCard label="Revenue Today" value="₹34,200" icon={BarChart3} />
        <StatCard label="Low Stock Items" value={lowStock.length} tone="rose" icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => setActive("add")} className="flex items-center justify-between rounded-[1.2rem] bg-[#111111] p-5 text-white">
          <span>+ Add a new product, Instagram-style</span><ChevronRight size={16} />
        </button>
        <button onClick={() => setActive("orders")} className="flex items-center justify-between rounded-[1.2rem] border border-black/10 bg-white p-5">
          <span>Export today's orders to Excel</span><FileSpreadsheet size={16} />
        </button>
      </div>
    </div>
  );
}

function AddProduct() {
  const [step, setStep] = useState(1);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tags, setTags] = useState(["Pakistani Suit", "Pink", "Embroidery"]);
  const [form, setForm] = useState({ title: "", price: "", stock: "", description: "" });
  const [voiceListening, setVoiceListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const steps = ["Photo", "AI Tags", "Details", "Publish"];

  const runAI = () => {
    setPhotoAdded(true);
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 1000);
  };

  const useVoice = () => {
    setVoiceListening((prev) => !prev);
  };

  const removeTag = (tag: string) => setTags((current) => current.filter((value) => value !== tag));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Add a Product</h1>
      <p className="mt-1 text-sm text-gray-500">Just like posting on Instagram — add a photo and we help with the rest.</p>
      <div className="mt-8 flex items-center gap-2">
        {steps.map((stepLabel, index) => (
          <div key={stepLabel} className="flex flex-1 items-center gap-2 text-xs text-gray-500">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${step >= index + 1 ? "bg-[#111111]" : "bg-gray-300"}`}>{index + 1}</span>
            {stepLabel}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-8 rounded-[1.4rem] border-2 border-dashed border-gray-300 p-10 text-center">
          {!photoAdded ? (
            <>
              <Camera size={30} className="mx-auto mb-4 text-[#B68D40]" />
              <p className="text-sm text-gray-600">Tap to add a photo of the outfit.</p>
              <button onClick={runAI} className="mt-4 rounded-full bg-[#111111] px-6 py-3 text-sm text-white">Choose Photo</button>
            </>
          ) : analyzing ? (
            <div className="flex flex-col items-center gap-3">
              <Sparkles size={24} className="animate-pulse text-[#B68D40]" />
              <p className="text-sm text-gray-600">Reading the photo and suggesting tags…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-52 w-40 rounded-[1.2rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
              <button onClick={() => setStep(2)} className="rounded-full bg-[#111111] px-6 py-3 text-sm text-white">Continue</button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#B68D40]" />
            <p className="text-sm text-gray-600">Our AI suggested these tags from your photo — remove anything that's not right.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-2 rounded-full bg-[#F8F5F1] px-3 py-2 text-sm text-[#111111]">
                {tag}
                <button onClick={() => removeTag(tag)}><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm"><ChevronLeft size={14} /> Back</button>
            <button onClick={() => setStep(3)} className="rounded-full bg-[#111111] px-6 py-3 text-sm text-white">Looks Good</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Price (₹)</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Stock</label>
                <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Description</label>
                <button onClick={useVoice} className={`rounded-full px-3 py-1.5 text-xs ${voiceListening ? "bg-[#D94F70] text-white" : "bg-[#F8F5F1] text-[#111111]"}`}>
                  <Mic size={12} className="mr-1 inline" /> {voiceListening ? "Listening…" : "Speak in Hindi or English"}
                </button>
              </div>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm"><ChevronLeft size={14} /> Back</button>
              <button onClick={() => setSaved(true)} className="flex items-center gap-2 rounded-full bg-[#F8F5F1] px-6 py-3 text-sm"><Save size={14} /> Save as Draft</button>
              <button onClick={() => setStep(4)} className="ml-auto rounded-full bg-[#111111] px-6 py-3 text-sm text-white">Continue</button>
            </div>
            {saved && <p className="text-xs text-gray-500">Saved to Drafts — you can finish this later.</p>}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-10 text-center shadow-sm">
          <Check size={36} className="mx-auto mb-4 text-[#3A9D5D]" />
          <h2 className="text-xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Ready to Publish</h2>
          <p className="mt-2 text-sm text-gray-500">“{form.title || "Pink Embroidered Pakistani Suit"}” will go live instantly.</p>
          <button onClick={() => setStep(1)} className="mt-6 rounded-full bg-[#111111] px-8 py-3 text-sm text-white">Publish Product</button>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState(ORDERS);
  const [selected, setSelected] = useState<any>(null);
  const [exported, setExported] = useState(false);

  const advance = (id: string) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status: order.status === "Pending" ? "Packed" : order.status === "Packed" ? "Out for Delivery" : "Delivered" } : order));
  };

  const reject = (id: string) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status: "Rejected" } : order));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Every order from the storefront appears here automatically.</p>
        </div>
        <button onClick={() => setExported(true)} className="rounded-full bg-[#111111] px-5 py-3 text-sm text-white">Export to Excel</button>
      </div>
      {exported && <div className="mt-4 rounded-[1rem] bg-[#EAF6EE] p-3 text-sm text-[#3A9D5D]">orders.xlsx generated — synced to your Google Sheet.</div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#FBFAF8] text-left text-xs uppercase tracking-[0.24em] text-gray-500">
              <tr>
                <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Amount</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} onClick={() => setSelected(order)} className="cursor-pointer border-t border-black/5">
                  <td className="p-3">{order.id}</td>
                  <td className="p-3">{order.name}</td>
                  <td className="p-3">₹{order.amount}</td>
                  <td className="p-3"><StatusPill status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          {!selected ? <p className="text-sm text-gray-400">Select an order to see details.</p> : (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>{selected.id}</p>
                  <p className="mt-1 text-sm text-gray-500">{selected.name} · {selected.phone}</p>
                </div>
                <StatusPill status={selected.status} />
              </div>
              <p className="mt-5 text-sm text-gray-600"><strong>Items:</strong> {selected.items}</p>
              <p className="mt-2 text-sm text-gray-600"><strong>Mode:</strong> {selected.mode}</p>
              <p className="mt-2 text-sm text-gray-600"><strong>Total:</strong> ₹{selected.amount}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => advance(selected.id)} className="rounded-full bg-[#111111] px-4 py-2 text-xs text-white">Advance Status</button>
                <button onClick={() => reject(selected.id)} className="rounded-full border border-[#D94F70] px-4 py-2 text-xs text-[#D94F70]">Reject</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Inventory() {
  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Inventory</h1>
      <p className="mt-1 text-sm text-gray-500">Stock updates automatically every time an order comes in.</p>
      <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
        {INVENTORY.map((item) => (
          <div key={item.name} className="flex items-center justify-between border-b border-black/5 p-4 last:border-b-0">
            <p className="text-sm text-[#111111]">{item.name}</p>
            <div className="flex items-center gap-3">
              {item.stock <= 2 && <span className="text-xs text-[#D94F70]">Low Stock</span>}
              <span className="w-10 text-right text-sm">{item.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Customers() {
  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Customers</h1>
      <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#FBFAF8] text-left text-xs uppercase tracking-[0.24em] text-gray-500">
            <tr><th className="p-3">Customer</th><th className="p-3">Orders</th><th className="p-3">Spend</th></tr>
          </thead>
          <tbody>
            {[
              { name: "Kavya Patnaik", orders: 6, spend: 32400 },
              { name: "Sneha Rout", orders: 4, spend: 21200 },
              { name: "Riya Sharma", orders: 3, spend: 15800 },
            ].map((customer) => (
              <tr key={customer.name} className="border-t border-black/5">
                <td className="p-3">{customer.name}</td>
                <td className="p-3">{customer.orders}</td>
                <td className="p-3">₹{customer.spend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Analytics() {
  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Analytics</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Top Product</p>
          <p className="mt-3 text-lg text-[#111111]">Rose Embroidered Anarkali</p>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Best Seller</p>
          <p className="mt-3 text-lg text-[#111111]">Sky Cotton Co-ord Set</p>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Monthly Growth</p>
          <p className="mt-3 text-lg text-[#111111]">+18%</p>
        </div>
      </div>
    </div>
  );
}

function Coupons() {
  return <div><h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Coupons</h1><div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">Create and manage promo campaigns for festive launches and loyal customers.</div></div>;
}

function HomepageEditor() {
  return <div><h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Homepage Editor</h1><div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">Reorder modules and highlight featured products without touching any code.</div></div>;
}

export default function DashboardPage() {
  const [active, setActive] = useState("home");

  return (
    <div className="min-h-screen bg-[#FBFAF8]">
      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm lg:block">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Owner Panel</p>
            <h2 className="mt-2 text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>RUBYZ Admin</h2>
          </div>
          <nav className="space-y-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActive(item.id)} className={`flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm ${active === item.id ? "bg-[#111111] text-white" : "text-[#111111] hover:bg-[#F8F5F1]"}`}>
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm lg:p-8">
          {active === "home" && <DashboardHome setActive={setActive} />}
          {active === "add" && <AddProduct />}
          {active === "orders" && <Orders />}
          {active === "inventory" && <Inventory />}
          {active === "customers" && <Customers />}
          {active === "analytics" && <Analytics />}
          {active === "coupons" && <Coupons />}
          {active === "homepage" && <HomepageEditor />}
        </main>
      </div>
    </div>
  );
}
