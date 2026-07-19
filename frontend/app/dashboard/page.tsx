"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, BarChart3, Boxes, Check, ClipboardList, LayoutGrid, Plus, Ticket,
  Users, Layout, ChevronRight, FileSpreadsheet, Save, X, Camera,
  ChevronLeft, Pencil, Trash2, Loader2, LogOut, Upload, ImageOff, Menu,
} from "lucide-react";
import type { Product } from "@/lib/content";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus, getDashboardStats, uploadImage, resolveImageUrl,
  getAttributes, type Order, type DashboardStats, type AttributeType,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { AttributeSelect } from "@/components/ui/attribute-select";

// Product fields backed by the taxonomy (attributes) table — dropdown +
// "add new" everywhere they're edited, instead of free text.
export type AttributeOptions = Record<AttributeType, string[]>;
const EMPTY_ATTRIBUTE_OPTIONS: AttributeOptions = { category: [], occasion: [], color: [], fabric: [] };

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

function ImageUploader({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await uploadImage(file);
        uploaded.push(url);
      }
      onChange([...images, ...uploaded]);
    } catch (e: any) {
      setError(e?.message || "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => onChange(images.filter((img) => img !== url));

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img} className="relative h-24 w-20 overflow-hidden rounded-[0.8rem] border border-black/10">
            <img src={resolveImageUrl(img)} alt="Product" className="h-full w-full object-cover" />
            <button
              onClick={() => removeImage(img)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              aria-label="Remove image"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[0.8rem] border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#B68D40] hover:text-[#B68D40]">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span className="text-[10px]">{uploading ? "Uploading" : "Add photo"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-[#D94F70]">{error}</p>}
    </div>
  );
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const AVAILABILITY_OPTIONS = ["In stock", "Low stock", "Made to order", "Out of stock"];

function SizePicker({ sizes, onChange }: { sizes: string[]; onChange: (sizes: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_SIZES.map((size) => {
        const active = sizes.includes(size);
        return (
          <button
            type="button"
            key={size}
            onClick={() => onChange(active ? sizes.filter((s) => s !== size) : [...sizes, size])}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${
              active ? "border-[#111111] bg-[#111111] text-white" : "border-black/10 text-gray-600 hover:border-[#B68D40]"
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}

function TagListInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();
    if (value && !tags.includes(value)) onChange([...tags, value]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm"
        />
        <button type="button" onClick={addTag} className="shrink-0 rounded-[1rem] border border-black/10 px-4 text-sm text-[#111111] hover:border-[#B68D40]">
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-[#F8F5F1] px-3 py-1 text-xs text-[#111111]">
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
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
        <div className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-[#EFD9B0] bg-[#FDF3E7] p-4">
          <AlertTriangle size={18} className="shrink-0 text-[#B68D40]" />
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

function AddProduct({
  onCreated,
  attributeOptions,
  onAttributeAdded,
}: {
  onCreated: () => void;
  attributeOptions: AttributeOptions;
  onAttributeAdded: (type: AttributeType, value: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", price: "", mrp: "", stock: "", description: "",
    category: "Pakistani Suits", fabric: "Georgette", occasion: "Party Wear", color: "",
    availability: "In stock",
  });
  const [care, setCare] = useState<string[]>(["Dry clean recommended"]);
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L"]);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const steps = ["Photos", "Details", "Publish"];

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
        care: care.length > 0 ? care : ["Dry clean recommended"],
        sizes: sizes.length > 0 ? sizes : ["Free Size"],
        images,
        availability: Number(form.stock) > 0 ? form.availability : "Out of stock",
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
          onClick={() => { setStep(1); setImages([]); setPublished(false); setCare(["Dry clean recommended"]); setSizes(["S", "M", "L"]); setForm({ title: "", price: "", mrp: "", stock: "", description: "", category: "Pakistani Suits", fabric: "Georgette", occasion: "Party Wear", color: "", availability: "In stock" }); }}
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
      <p className="mt-1 text-sm text-gray-500">Upload real photos of the outfit, then fill in the details.</p>
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
          <Camera size={30} className="mx-auto mb-4 text-[#B68D40]" />
          <p className="text-sm text-gray-600">Upload one or more photos of the outfit.</p>
          <div className="mt-5 flex justify-center">
            <ImageUploader images={images} onChange={setImages} />
          </div>
          <button onClick={() => setStep(2)} className="mt-6 rounded-full bg-[#111111] px-6 py-3 text-sm text-white">
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
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
              <AttributeSelect
                label="Category"
                type="category"
                value={form.category}
                options={attributeOptions.category}
                onChange={(value) => setForm({ ...form, category: value })}
                onOptionAdded={(value) => onAttributeAdded("category", value)}
              />
              <AttributeSelect
                label="Color"
                type="color"
                value={form.color}
                options={attributeOptions.color}
                onChange={(value) => setForm({ ...form, color: value })}
                onOptionAdded={(value) => onAttributeAdded("color", value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <AttributeSelect
                label="Fabric"
                type="fabric"
                value={form.fabric}
                options={attributeOptions.fabric}
                onChange={(value) => setForm({ ...form, fabric: value })}
                onOptionAdded={(value) => onAttributeAdded("fabric", value)}
              />
              <AttributeSelect
                label="Occasion"
                type="occasion"
                value={form.occasion}
                options={attributeOptions.occasion}
                onChange={(value) => setForm({ ...form, occasion: value })}
                onOptionAdded={(value) => onAttributeAdded("occasion", value)}
              />
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Availability</label>
                <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm">
                  {AVAILABILITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Available Sizes</label>
              <div className="mt-1"><SizePicker sizes={sizes} onChange={setSizes} /></div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Care Instructions</label>
              <div className="mt-1"><TagListInput tags={care} onChange={setCare} placeholder="e.g. Dry clean only — press Enter" /></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm"><ChevronLeft size={14} /> Back</button>
              <button onClick={() => setSaved(true)} className="flex items-center gap-2 rounded-full bg-[#F8F5F1] px-6 py-3 text-sm"><Save size={14} /> Save as Draft</button>
              <button onClick={() => setStep(3)} className="rounded-full bg-[#111111] px-6 py-3 text-sm text-white sm:ml-auto">Continue</button>
            </div>
            {saved && <p className="text-xs text-gray-500">Saved locally — continue whenever you're ready.</p>}
          </div>
        </div>
      )}

      {step === 3 && (
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

// Formats an ISO timestamp for the orders table: just the time for orders
// placed today (in the browser's local timezone), otherwise a short date +
// time so older orders are still easy to place in time.
function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatOrderTimestamp(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isSameLocalDay(date, new Date())) return time;
  const day = date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${day}, ${time}`;
}

function OrdersTable({
  title,
  subtitle,
  orders,
  selected,
  onSelect,
  emptyLabel,
}: {
  title: string;
  subtitle?: string;
  orders: Order[];
  selected: Order | null;
  onSelect: (order: Order) => void;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
      <div className="flex items-baseline justify-between gap-3 border-b border-black/5 px-4 py-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-[#111111]">
          {title} <span className="text-gray-400">({orders.length})</span>
        </h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {orders.length === 0 ? (
        <p className="p-5 text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-[#FBFAF8] text-left text-xs uppercase tracking-[0.24em] text-gray-500">
              <tr>
                <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Amount</th>
                <th className="p-3">Placed</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onSelect(order)}
                  className={`cursor-pointer border-t border-black/5 ${selected?.id === order.id ? "bg-[#FBFAF8]" : ""}`}
                >
                  <td className="p-3">{order.id}</td>
                  <td className="p-3">{order.customerName}</td>
                  <td className="p-3">₹{order.total}</td>
                  <td className="p-3 text-gray-500">{formatOrderTimestamp(order.createdAt)}</td>
                  <td className="p-3"><StatusPill status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
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

  const todayOrders = orders.filter((o) => isSameLocalDay(new Date(o.createdAt), new Date()));

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
          <div className="space-y-6">
            <OrdersTable
              title="Today's Orders"
              orders={todayOrders}
              selected={selected}
              onSelect={setSelected}
              emptyLabel="No orders placed today yet."
            />
            <OrdersTable
              title="All Orders"
              subtitle="Full order history"
              orders={orders}
              selected={selected}
              onSelect={setSelected}
              emptyLabel="No orders yet."
            />
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
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-400">
                  Placed {new Date(selected.createdAt).toLocaleString(undefined, {
                    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </p>
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

function EditProductModal({
  product,
  onClose,
  onSaved,
  attributeOptions,
  onAttributeAdded,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
  attributeOptions: AttributeOptions;
  onAttributeAdded: (type: AttributeType, value: string) => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    mrp: String(product.mrp),
    stock: String(product.stock ?? 0),
    description: product.description,
    category: product.category,
    fabric: product.fabric,
    occasion: product.occasion,
    color: product.color,
    availability: product.availability || "In stock",
  });
  const [care, setCare] = useState<string[]>(product.care ?? []);
  const [sizes, setSizes] = useState<string[]>(product.sizes ?? []);
  const [images, setImages] = useState<string[]>(product.images ?? []);
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
        category: form.category,
        fabric: form.fabric,
        occasion: form.occasion,
        color: form.color,
        availability: form.availability,
        care,
        sizes,
        images,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.4rem] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Edit Product</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Photos</label>
            <div className="mt-1">
              <ImageUploader images={images} onChange={setImages} />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AttributeSelect
              label="Category"
              type="category"
              value={form.category}
              options={attributeOptions.category}
              onChange={(value) => setForm({ ...form, category: value })}
              onOptionAdded={(value) => onAttributeAdded("category", value)}
            />
            <AttributeSelect
              label="Color"
              type="color"
              value={form.color}
              options={attributeOptions.color}
              onChange={(value) => setForm({ ...form, color: value })}
              onOptionAdded={(value) => onAttributeAdded("color", value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <AttributeSelect
              label="Fabric"
              type="fabric"
              value={form.fabric}
              options={attributeOptions.fabric}
              onChange={(value) => setForm({ ...form, fabric: value })}
              onOptionAdded={(value) => onAttributeAdded("fabric", value)}
            />
            <AttributeSelect
              label="Occasion"
              type="occasion"
              value={form.occasion}
              options={attributeOptions.occasion}
              onChange={(value) => setForm({ ...form, occasion: value })}
              onOptionAdded={(value) => onAttributeAdded("occasion", value)}
            />
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Availability</label>
              <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm">
                {AVAILABILITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Available Sizes</label>
            <div className="mt-1"><SizePicker sizes={sizes} onChange={setSizes} /></div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Care Instructions</label>
            <div className="mt-1"><TagListInput tags={care} onChange={setCare} placeholder="e.g. Dry clean only — press Enter" /></div>
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

function Inventory({
  products,
  loading,
  onChanged,
  attributeOptions,
  onAttributeAdded,
}: {
  products: Product[];
  loading: boolean;
  onChanged: () => void;
  attributeOptions: AttributeOptions;
  onAttributeAdded: (type: AttributeType, value: string) => void;
}) {
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
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 p-4 last:border-b-0">
              <div className="flex min-w-0 items-center gap-3">
                {product.images?.[0] ? (
                  <img src={resolveImageUrl(product.images[0])} alt={product.name} className="h-12 w-10 shrink-0 rounded-[0.5rem] object-cover" />
                ) : (
                  <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-[0.5rem] bg-[#F8F5F1] text-gray-400">
                    <ImageOff size={14} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#111111]">{product.name}</p>
                  <p className="text-xs text-gray-400">₹{product.price} · {product.category}</p>
                </div>
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
        <EditProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
          attributeOptions={attributeOptions}
          onAttributeAdded={onAttributeAdded}
        />
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [attributeOptions, setAttributeOptions] = useState<AttributeOptions>(EMPTY_ATTRIBUTE_OPTIONS);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, statsData, attributesData] = await Promise.all([
        getProducts(),
        getDashboardStats(),
        getAttributes(),
      ]);
      setProducts(productsData);
      setStats(statsData);
      const grouped: AttributeOptions = { category: [], occasion: [], color: [], fabric: [] };
      for (const attribute of attributesData) grouped[attribute.type].push(attribute.value);
      setAttributeOptions(grouped);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a freshly-created option to local state immediately, so it's
  // available in every dropdown without waiting on a full refresh.
  const handleAttributeAdded = useCallback((type: AttributeType, value: string) => {
    setAttributeOptions((current) => {
      if (current[type].includes(value)) return current;
      return { ...current, [type]: [...current[type], value].sort() };
    });
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

  const activeLabel = NAV.find((item) => item.id === active)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-[#FBFAF8]">
      {/* Mobile top bar: hamburger + current section label, replaces the hidden sidebar */}
      <div className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-4 lg:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-full border border-black/10 p-2"
          aria-label="Open dashboard menu"
          aria-expanded={mobileNavOpen}
        >
          <Menu size={18} />
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#111111]">{activeLabel}</p>
        <div className="w-9" />
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden">
          <button
            aria-label="Close menu overlay"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex h-full w-[82vw] max-w-xs flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Owner Panel</p>
                <h2 className="mt-2 text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>RUBYZ Admin</h2>
                <p className="mt-1 truncate text-xs text-gray-400">{user.email}</p>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="rounded-full border border-black/10 p-2" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-2">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActive(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm ${active === item.id ? "bg-[#111111] text-white" : "text-[#111111] hover:bg-[#F8F5F1]"}`}
                  >
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
          </div>
        </div>
      )}

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

        <main className="flex-1 rounded-[2rem] border border-black/5 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          {active === "home" && <DashboardHome setActive={setActive} stats={stats} lowStockCount={lowStockCount} loading={loading} />}
          {active === "add" && (
            <AddProduct onCreated={refresh} attributeOptions={attributeOptions} onAttributeAdded={handleAttributeAdded} />
          )}
          {active === "orders" && <Orders />}
          {active === "inventory" && (
            <Inventory
              products={products}
              loading={loading}
              onChanged={refresh}
              attributeOptions={attributeOptions}
              onAttributeAdded={handleAttributeAdded}
            />
          )}
          {active === "customers" && <Customers />}
          {active === "analytics" && <Analytics products={products} />}
          {active === "coupons" && <Coupons />}
          {active === "homepage" && <HomepageEditor />}
        </main>
      </div>
    </div>
  );
}
