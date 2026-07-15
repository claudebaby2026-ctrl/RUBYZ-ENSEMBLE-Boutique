"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, BarChart3, Boxes, Check, ClipboardList, LayoutGrid, Plus, Ticket,
  Users, Layout, ChevronRight, FileSpreadsheet, Save, Sparkles, X, Mic, Camera,
  ChevronLeft, Pencil, Trash2, Loader2, LogOut,
} from "lucide-react";
import type { Product } from "@/lib/content";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus, getDashboardStats,
  type Order, type DashboardStats,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

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

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `product-${Date.now()}`;
}

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
  const bg = ({
    Pending: "#B68D40",
    Packed: "#5B7FBA",
    "Out for Delivery": "#D94F70",
    Delivered: "#3A9D5D",
    Rejected: "#999",
  } as Record<string, string>)[status] || "#999";

  return <span className="rounded-full px-2.5 py-1 text-[11px] text-white" style={{ background: bg }}>{status}</span>;
}

function DashboardHome({ setActive, stats, lowStockCount, loading }: {
  setActive: (id: string) => void;
  stats: DashboardStats | null;
  lowStockCount: number;
  loading: boolean;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Good morning 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Here is how the boutique is performing today.</p>
      </div>

      {!loading && lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-[1.2rem] border border-[#EFD9B0] bg-[#FDF3E7] p-4">
          <AlertTriangle size={18} className="text-[#B68D40]" />
          <p className="text-sm text-[#111111]"><strong>{lowStockCount} product(s)</strong> are running low on stock.</p>
          <button onClick={() => setActive("inventory")} className="ml-auto text-xs uppercase tracking-[0.24em] underline">View</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders" value={loading ? "…" : stats?.todayOrders ?? 0} icon={ClipboardList} />
        <StatCard label="Pending Orders" value={loading ? "…" : stats?.pendingOrders ?? 0} tone="rose" icon={AlertTriangle} />
        <StatCard label="Total Revenue" value={loading ? "…" : `₹${(stats?.revenueToday ?? 0).toLocaleString()}`} icon={BarChart3} />
        <StatCard label="Low Stock Items" value={loading ? "…" : lowStockCount} tone="rose" icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => setActive("add")} className="flex items-center justify-between rounded-[1.2rem] bg-[#111111] p-5 text-white">
          <span>+ Add a new product, Instagram-style</span><ChevronRight size={16} />
        </button>
        <button onClick={() => setActive("orders")} className="flex items-center justify-between rounded-[1.2rem] border border-black/10 bg-white p-5">
          <span>View today's orders</span><FileSpreadsheet size={16} />
        </button>
      </div>
    </div>
  );
}

function AddProduct({ onCreated }: { onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tags, setTags] = useState(["Pakistani Suit", "Pink", "Embroidery"]);
  const [form, setForm] = useState({
    title: "", price: "", mrp: "", stock: "", description: "",
    category: "Pakistani Suits", fabric: "Georgette", occasion: "Party Wear", color: "",
  });
  const [voiceListening, setVoiceListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const steps = ["Photo", "AI Tags", "Details", "Publish"];

  const runAI = () => {
    setPhotoAdded(true);
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 1000);
  };

  const useVoice = () => setVoiceListening((prev) => !prev);
  const removeTag = (tag: string) => setTags((current) => current.filter((value) => value !== tag));

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const price = Number(form.price) || 0;
      await createProduct({
        slug: slugify(form.title),
        name: form.title || "Untitled Product",
        category: form.category,
        fabric: form.fabric,
        occasion: form.occasion,
        color: form.color || "Multi",
        price,
        mrp: Number(form.mrp) || price,
        stock: Number(form.stock) || 0,
        rating: 0,
        sold: 0,
        badge: "NEW",
        description: form.description,
        care: ["Dry clean recommended"],
        sizes: ["S", "M", "L"],
        availability: Number(form.stock) > 0 ? "In stock" : "Out of stock",
        isNew: true,
      });
      setPublished(true);
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Could not publish product");
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="max-w-2xl rounded-[1.4rem] border border-black/5 bg-white p-10 text-center shadow-sm">
        <Check size={36} className="mx-auto mb-4 text-[#3A9D5D]" />
        <h2 className="text-xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Published!</h2>
        <p className="mt-2 text-sm text-gray-500">"{form.title}" is now live in the store and inventory.</p>
        <button
          onClick={() => { setStep(1); setPhotoAdded(false); setPublished(false); setForm({ title: "", price: "", mrp: "", stock: "", description: "", category: "Pakistani Suits", fabric: "Georgette", occasion: "Party Wear", color: "" }); }}
          className="mt-6 rounded-full bg-[#111111] px-8 py-3 text-sm text-white"
        >
          Add Another Product
        </button>
      </div>
    );
  }

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
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Price (₹)</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">MRP (₹)</label>
                <input value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Stock</label>
                <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Color</label>
                <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
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
            {saved && <p className="text-xs text-gray-500">Saved locally — continue whenever you're ready.</p>}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-10 text-center shadow-sm">
          <Check size={36} className="mx-auto mb-4 text-[#3A9D5D]" />
          <h2 className="text-xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Ready to Publish</h2>
          <p className="mt-2 text-sm text-gray-500">"{form.title || "Untitled product"}" will be saved to the database and go live instantly.</p>
          {error && <p className="mt-3 text-sm text-[#D94F70]">{error}</p>}
          <button onClick={publish} disabled={publishing} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111111] px-8 py-3 text-sm text-white disabled:opacity-60">
            {publishing && <Loader2 size={14} className="animate-spin" />}
            {publishing ? "Publishing…" : "Publish Product"}
          </button>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextStatus = (status: string) =>
    status === "Pending" ? "Packed" : status === "Packed" ? "Out for Delivery" : "Delivered";

  const advance = async (order: Order) => {
    const updated = await updateOrderStatus(order.id, nextStatus(order.status));
    setOrders((current) => current.map((o) => (o.id === order.id ? updated : o)));
    if (selected?.id === order.id) setSelected(updated);
  };

  const reject = async (order: Order) => {
    const updated = await updateOrderStatus(order.id, "Rejected");
    setOrders((current) => current.map((o) => (o.id === order.id ? updated : o)));
    if (selected?.id === order.id) setSelected(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Every order from the storefront appears here automatically.</p>
        </div>
      </div>
      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No orders yet.</p>
      ) : (
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
                    <td className="p-3">{order.customerName}</td>
                    <td className="p-3">₹{order.total}</td>
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
                    <p className="mt-1 text-sm text-gray-500">{selected.customerName} · {selected.phone}</p>
                  </div>
                  <StatusPill status={selected.status} />
                </div>
                <p className="mt-5 text-sm text-gray-600"><strong>Items:</strong> {selected.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</p>
                <p className="mt-2 text-sm text-gray-600"><strong>Mode:</strong> {selected.mode}</p>
                <p className="mt-2 text-sm text-gray-600"><strong>Total:</strong> ₹{selected.total}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={() => advance(selected)} className="rounded-full bg-[#111111] px-4 py-2 text-xs text-white">Advance Status</button>
                  <button onClick={() => reject(selected)} className="rounded-full border border-[#D94F70] px-4 py-2 text-xs text-[#D94F70]">Reject</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditProductModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    mrp: String(product.mrp),
    stock: String(product.stock ?? 0),
    description: product.description,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name: form.name,
        price: Number(form.price) || 0,
        mrp: Number(form.mrp) || 0,
        stock: Number(form.stock) || 0,
        description: form.description,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-md rounded-[1.4rem] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Edit Product</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Price</label>
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">MRP</label>
              <input value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Stock</label>
              <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-black/10 px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-full bg-[#111111] px-5 py-2.5 text-sm text-white disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function Inventory({ products, loading, onChanged }: { products: Product[]; loading: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const remove = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      onChanged();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Inventory</h1>
      <p className="mt-1 text-sm text-gray-500">Every product here is read straight from the database — edit or remove anytime.</p>
      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No products yet. Add your first one from "Add Product".</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3 border-b border-black/5 p-4 last:border-b-0">
              <div>
                <p className="text-sm text-[#111111]">{product.name}</p>
                <p className="text-xs text-gray-400">₹{product.price} · {product.category}</p>
              </div>
              <div className="flex items-center gap-3">
                {(product.stock ?? 0) <= 3 && <span className="text-xs text-[#D94F70]">Low Stock</span>}
                <span className="w-10 text-right text-sm">{product.stock ?? 0}</span>
                <button onClick={() => setEditing(product)} className="rounded-full border border-black/10 p-2 text-[#111111]"><Pencil size={14} /></button>
                <button onClick={() => remove(product)} disabled={deletingId === product.id} className="rounded-full border border-[#D94F70] p-2 text-[#D94F70] disabled:opacity-50">
                  {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <EditProductModal product={editing} onClose={() => setEditing(null)} onSaved={onChanged} />
      )}
    </div>
  );
}

function Customers() {
  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Customers</h1>
      <p className="mt-1 text-sm text-gray-500">Customer accounts aren't tracked yet — this will populate once checkout captures customer records.</p>
    </div>
  );
}

function Analytics({ products }: { products: Product[] }) {
  const topByRating = [...products].sort((a, b) => b.rating - a.rating)[0];
  const topBySold = [...products].sort((a, b) => b.sold - a.sold)[0];
  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Analytics</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Top Rated Product</p>
          <p className="mt-3 text-lg text-[#111111]">{topByRating?.name ?? "—"}</p>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Best Seller</p>
          <p className="mt-3 text-lg text-[#111111]">{topBySold?.name ?? "—"}</p>
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
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [active, setActive] = useState("home");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, statsData] = await Promise.all([getProducts(), getDashboardStats()]);
      setProducts(productsData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role !== "owner") {
      router.replace("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "owner") refresh();
  }, [user, refresh]);

  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= 3).length;

  // While we verify the session, or if the redirect above hasn't happened
  // yet, never render owner data.
  if (authLoading || user?.role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAF8]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Checking your session…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAF8]">
      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm lg:block">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Owner Panel</p>
            <h2 className="mt-2 text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>RUBYZ Admin</h2>
            <p className="mt-1 truncate text-xs text-gray-400">{user.email}</p>
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
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm text-[#D94F70] hover:bg-[#F8F5F1]"
            >
              <LogOut size={16} /> Log out
            </button>
          </nav>
        </aside>

        <main className="flex-1 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm lg:p-8">
          {active === "home" && <DashboardHome setActive={setActive} stats={stats} lowStockCount={lowStockCount} loading={loading} />}
          {active === "add" && <AddProduct onCreated={refresh} />}
          {active === "orders" && <Orders />}
          {active === "inventory" && <Inventory products={products} loading={loading} onChanged={refresh} />}
          {active === "customers" && <Customers />}
          {active === "analytics" && <Analytics products={products} />}
          {active === "coupons" && <Coupons />}
          {active === "homepage" && <HomepageEditor />}
        </main>
      </div>
    </div>
  );
}
