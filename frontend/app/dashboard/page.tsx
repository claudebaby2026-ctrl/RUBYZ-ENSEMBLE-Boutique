"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, BarChart3, Boxes, Check, ClipboardList, LayoutGrid, Plus, Ticket,
  Users, Layout, ChevronRight, FileSpreadsheet, Save, X, Camera,
  ChevronLeft, Pencil, Trash2, Loader2, LogOut, Upload, ImageOff, Menu,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Product } from "@/lib/content";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus, getDashboardStats, uploadImage, resolveImageUrl,
  getAttributes, type Order, type DashboardStats, type AttributeType,
  getCustomers, type Customer,
  getCoupons, createCoupon, updateCoupon, deleteCoupon, type Coupon,
  getHomepageConfig, updateHomepageConfig, type HomepageConfig,
  retryShipment, humanizeShipmentStatus,
  getShippingDefaults, updateShippingDefaults, type ShippingDefaultRow,
  ApiError,
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
  { id: "shipping-defaults", label: "Shipping Defaults", icon: FileSpreadsheet },
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

function ShipmentPill({ status }: { status?: string }) {
  const normalized = (status || "not_created").toLowerCase();
  const bg = ({
    not_created: "#999",
    pending: "#B68D40",
    created: "#5B7FBA",
    failed: "#D94F70",
    delivered: "#3A9D5D",
  } as Record<string, string>)[normalized] || "#5B7FBA";
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] text-white" style={{ background: bg }}>
      {humanizeShipmentStatus(status)}
    </span>
  );
}

function OrdersTable({
  title,
  subtitle,
  orders,
  selected,
  onSelect,
  emptyLabel,
  onRetryShipment,
  retryingId,
}: {
  title: string;
  subtitle?: string;
  orders: Order[];
  selected: Order | null;
  onSelect: (order: Order) => void;
  emptyLabel: string;
  onRetryShipment: (order: Order) => void;
  retryingId: string | null;
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
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-[#FBFAF8] text-left text-xs uppercase tracking-[0.24em] text-gray-500">
              <tr>
                <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Amount</th>
                <th className="p-3">Placed</th><th className="p-3">Status</th><th className="p-3">Shipment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const canRetry = order.shipmentStatus === "not_created" || order.shipmentStatus === "failed";
                return (
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
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-1">
                        <ShipmentPill status={order.shipmentStatus} />
                        {order.awbCode && (
                          <span className="text-[11px] text-gray-400">
                            AWB {order.awbCode}{order.courierName ? ` · ${order.courierName}` : ""}
                          </span>
                        )}
                        {canRetry && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onRetryShipment(order); }}
                            disabled={retryingId === order.id}
                            className="mt-0.5 rounded-full border border-black/10 px-2.5 py-1 text-[11px] text-[#111111] disabled:opacity-50"
                          >
                            {retryingId === order.id ? "Retrying…" : "Create Shipment"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

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

  const retry = async (order: Order) => {
    setRetryingId(order.id);
    setRetryError(null);
    try {
      const result = await retryShipment(order.id);
      setOrders((current) =>
        current.map((o) => (o.id === order.id ? { ...o, ...result } : o))
      );
      setSelected((current) => (current?.id === order.id ? { ...current, ...result } : current));
    } catch (e: any) {
      // 502 with a detail string means Shiprocket rejected/failed the
      // request — surface it so the owner knows to check server logs.
      setRetryError(e instanceof ApiError ? e.message : "Could not create the shipment. Please try again.");
    } finally {
      setRetryingId(null);
    }
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
      {retryError && <p className="mt-4 text-sm text-[#D94F70]">{retryError}</p>}
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
              onRetryShipment={retry}
              retryingId={retryingId}
            />
            <OrdersTable
              title="All Orders"
              subtitle="Full order history"
              orders={orders}
              selected={selected}
              onSelect={setSelected}
              emptyLabel="No orders yet."
              onRetryShipment={retry}
              retryingId={retryingId}
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
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <strong>Shipment:</strong> <ShipmentPill status={selected.shipmentStatus} />
                </div>
                {selected.awbCode && (
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>AWB:</strong> {selected.awbCode}{selected.courierName ? ` · ${selected.courierName}` : ""}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={() => advance(selected)} className="rounded-full bg-[#111111] px-4 py-2 text-xs text-white">Advance Status</button>
                  <button onClick={() => reject(selected)} className="rounded-full border border-[#D94F70] px-4 py-2 text-xs text-[#D94F70]">Reject</button>
                  {(selected.shipmentStatus === "not_created" || selected.shipmentStatus === "failed") && (
                    <button
                      onClick={() => retry(selected)}
                      disabled={retryingId === selected.id}
                      className="rounded-full border border-black/10 px-4 py-2 text-xs text-[#111111] disabled:opacity-50"
                    >
                      {retryingId === selected.id ? "Retrying…" : "Create Shipment"}
                    </button>
                  )}
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
  const [showShipping, setShowShipping] = useState(false);
  // Blank string means "unset / use category default" — never coerced to
  // 0, since 0 would be a real (wrong) override.
  const [shipping, setShipping] = useState({
    weight: product.weight != null ? String(product.weight) : "",
    length: product.length != null ? String(product.length) : "",
    breadth: product.breadth != null ? String(product.breadth) : "",
    height: product.height != null ? String(product.height) : "",
  });

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
        weight: shipping.weight.trim() === "" ? null : Number(shipping.weight),
        length: shipping.length.trim() === "" ? null : Number(shipping.length),
        breadth: shipping.breadth.trim() === "" ? null : Number(shipping.breadth),
        height: shipping.height.trim() === "" ? null : Number(shipping.height),
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
          <div className="rounded-[1rem] border border-black/10 p-3">
            <button
              type="button"
              onClick={() => setShowShipping((v) => !v)}
              className="flex w-full items-center justify-between text-xs uppercase tracking-[0.24em] text-gray-500"
            >
              Shipping override (optional)
              <ChevronRight size={14} className={`transition-transform ${showShipping ? "rotate-90" : ""}`} />
            </button>
            {showShipping && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400">
                  Leave blank to use the category or store-wide default from Shipping Defaults.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Weight (kg)</label>
                    <input
                      value={shipping.weight}
                      onChange={(e) => setShipping({ ...shipping, weight: e.target.value })}
                      placeholder="—"
                      className="mt-1 w-full rounded-[0.7rem] border border-black/10 px-2.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Length (cm)</label>
                    <input
                      value={shipping.length}
                      onChange={(e) => setShipping({ ...shipping, length: e.target.value })}
                      placeholder="—"
                      className="mt-1 w-full rounded-[0.7rem] border border-black/10 px-2.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Breadth (cm)</label>
                    <input
                      value={shipping.breadth}
                      onChange={(e) => setShipping({ ...shipping, breadth: e.target.value })}
                      placeholder="—"
                      className="mt-1 w-full rounded-[0.7rem] border border-black/10 px-2.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Height (cm)</label>
                    <input
                      value={shipping.height}
                      onChange={(e) => setShipping({ ...shipping, height: e.target.value })}
                      placeholder="—"
                      className="mt-1 w-full rounded-[0.7rem] border border-black/10 px-2.5 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCustomers()
      .then((data) => { if (!cancelled) setCustomers(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Customers</h1>
      <p className="mt-1 text-sm text-gray-500">Every account that has signed in, with their order history at a glance.</p>
      {error && <p className="mt-4 text-sm text-[#D94F70]">{error}</p>}
      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading customers…</p>
      ) : customers.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No customer accounts yet — this fills in as people sign up and check out.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-500">
                <th className="p-4 font-normal">Name</th>
                <th className="p-4 font-normal">Contact</th>
                <th className="p-4 font-normal">Orders</th>
                <th className="p-4 font-normal">Total Spent</th>
                <th className="p-4 font-normal">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-b-0">
                  <td className="p-4 text-[#111111]">{c.name}</td>
                  <td className="p-4 text-gray-500">
                    <p>{c.email}</p>
                    {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                  </td>
                  <td className="p-4 text-gray-500">{c.ordersCount}</td>
                  <td className="p-4 text-gray-500">₹{c.totalSpent.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-gray-500">
                    {c.lastOrderAt ? formatOrderTimestamp(c.lastOrderAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "#B68D40",
  Packed: "#3A9D5D",
  "Out for Delivery": "#111111",
  Delivered: "#2F7D46",
  Rejected: "#D94F70",
};
const FALLBACK_STATUS_COLOR = "#9CA3AF";

function Analytics({ products }: { products: Product[] }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrders()
      .then((data) => { if (!cancelled) setOrders(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const topByRating = [...products].sort((a, b) => b.rating - a.rating)[0];
  const topBySold = [...products].sort((a, b) => b.sold - a.sold)[0];

  // Revenue + order volume over the last 14 days.
  const revenueByDay = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      map.set(d.toDateString(), { revenue: 0, orders: 0 });
    }
    for (const o of orders) {
      const key = new Date(o.createdAt).toDateString();
      const entry = map.get(key);
      if (entry) {
        entry.revenue += o.total;
        entry.orders += 1;
      }
    }
    return Array.from(map.entries()).map(([key, val]) => ({
      label: new Date(key).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      revenue: val.revenue,
      orders: val.orders,
    }));
  }, [orders]);

  // Order status breakdown.
  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [orders]);

  // Top products by revenue (price × quantity summed across every order
  // line), not just units sold.
  const topProductsByRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) {
        map.set(item.name, (map.get(item.name) ?? 0) + item.price * item.quantity);
      }
    }
    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Analytics</h1>

      {error && <p className="mt-4 text-sm text-[#D94F70]">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Top Rated Product</p>
          <p className="mt-3 text-lg text-[#111111]">{topByRating?.name ?? "—"}</p>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Best Seller</p>
          <p className="mt-3 text-lg text-[#111111]">{topBySold?.name ?? "—"}</p>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Total Revenue</p>
          <p className="mt-3 text-lg text-[#111111]">{loading ? "…" : `₹${totalRevenue.toLocaleString()}`}</p>
        </div>
        <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Average Order Value</p>
          <p className="mt-3 text-lg text-[#111111]">{loading ? "…" : `₹${averageOrderValue.toLocaleString()}`}</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading order data…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No orders yet — charts will appear once orders start coming in.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Revenue — Last 14 Days</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" width={48} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#B68D40" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Order Volume — Last 14 Days</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="#9CA3AF" width={32} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#111111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Orders by Status</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? FALLBACK_STATUS_COLOR} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Top Products by Revenue</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsByRevenue} layout="vertical" margin={{ top: 5, right: 24, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={160} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#B68D40" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", discount_type: "percent" as "percent" | "flat", discount_value: "10", usage_limit: "" });

  const load = useCallback(() => {
    setLoading(true);
    getCoupons()
      .then(setCoupons)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createCoupon({
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      });
      setForm({ code: "", discount_type: "percent", discount_value: "10", usage_limit: "" });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setBusyId(coupon.id);
    try {
      await updateCoupon(coupon.id, { active: !coupon.active });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    setBusyId(coupon.id);
    try {
      await deleteCoupon(coupon.id);
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Coupons</h1>
      <p className="mt-1 text-sm text-gray-500">Create and manage promo campaigns for festive launches and loyal customers.</p>

      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="FESTIVE25"
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm uppercase"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">Type</label>
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "flat" })}
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm"
          >
            <option value="percent">Percent off</option>
            <option value="flat">Flat ₹ off</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">
            {form.discount_type === "percent" ? "Discount %" : "Discount ₹"}
          </label>
          <input
            type="number"
            min={0}
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">Usage limit</label>
          <input
            type="number"
            min={0}
            value={form.usage_limit}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            placeholder="Unlimited"
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={creating || !form.code.trim()}
            className="flex items-center gap-2 rounded-full bg-[#111111] px-6 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Coupon
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-[#D94F70]">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No coupons yet — create your first campaign above.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 p-4 last:border-b-0">
              <div>
                <p className="text-sm tracking-[0.1em] text-[#111111]">{c.code}</p>
                <p className="text-xs text-gray-400">
                  {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                  {" · "}{c.used_count} used{c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs uppercase tracking-[0.18em] ${c.active ? "text-green-600" : "text-gray-400"}`}>
                  {c.active ? "Active" : "Paused"}
                </span>
                <button
                  onClick={() => toggleActive(c)}
                  disabled={busyId === c.id}
                  className="rounded-full border border-black/10 p-2 text-[#111111] disabled:opacity-50"
                  title={c.active ? "Pause coupon" : "Activate coupon"}
                >
                  {busyId === c.id ? <Loader2 size={14} className="animate-spin" /> : c.active ? <X size={14} /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => remove(c)}
                  disabled={busyId === c.id}
                  className="rounded-full border border-[#D94F70] p-2 text-[#D94F70] disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HomepageEditor({ products }: { products: Product[] }) {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHomepageConfig()
      .then((data) => { if (!cancelled) setConfig(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleFeatured = (id: number) => {
    if (!config) return;
    const already = config.featured_product_ids.includes(id);
    const next = already
      ? config.featured_product_ids.filter((p) => p !== id)
      : [...config.featured_product_ids, id];
    setConfig({ ...config, featured_product_ids: next });
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateHomepageConfig(config);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div>
        <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Homepage Editor</h1>
        <p className="mt-8 text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Homepage Editor</h1>
      <p className="mt-1 text-sm text-gray-500">Edit the hero copy and choose which products get featured on the storefront homepage.</p>

      <div className="mt-8 space-y-4 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">Hero Heading</label>
          <input
            value={config.hero_heading}
            onChange={(e) => setConfig({ ...config, hero_heading: e.target.value })}
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">Hero Subheading</label>
          <textarea
            value={config.hero_subheading}
            onChange={(e) => setConfig({ ...config, hero_subheading: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-gray-500">Announcement Banner (optional)</label>
          <input
            value={config.banner_text}
            onChange={(e) => setConfig({ ...config, banner_text: e.target.value })}
            placeholder="e.g. Free shipping on orders above ₹4999"
            className="mt-1 w-full rounded-[0.7rem] border border-black/10 p-2.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Featured Products</p>
        <p className="mt-1 text-xs text-gray-400">Selected products appear in the homepage&apos;s featured module.</p>
        {products.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Add products from &quot;Add Product&quot; first.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const checked = config.featured_product_ids.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-[0.9rem] border p-3 text-sm ${checked ? "border-[#111111] bg-[#F8F5F1]" : "border-black/10"}`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleFeatured(p.id)} className="accent-[#111111]" />
                  {p.images?.[0] ? (
                    <img src={resolveImageUrl(p.images[0])} alt={p.name} className="h-10 w-8 rounded-[0.4rem] object-cover" />
                  ) : (
                    <div className="flex h-10 w-8 items-center justify-center rounded-[0.4rem] bg-[#F8F5F1] text-gray-400"><ImageOff size={12} /></div>
                  )}
                  <span className="truncate">{p.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-[#D94F70]">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 flex items-center gap-2 rounded-full bg-[#111111] px-6 py-2.5 text-sm text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  );
}

function ShippingDefaultsEditor() {
  const [rows, setRows] = useState<ShippingDefaultRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShippingDefaults()
      .then((data) => { if (!cancelled) setRows(data.rows); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updateRow = (index: number, field: keyof ShippingDefaultRow, value: string) => {
    if (!rows) return;
    const next = [...rows];
    next[index] = { ...next[index], [field]: field === "category" ? value : Number(value) || 0 };
    setRows(next);
  };

  const save = async () => {
    if (!rows) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateShippingDefaults({ rows });
      setRows(updated.rows);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rows) {
    return (
      <div>
        <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Shipping Defaults</h1>
        <p className="mt-8 text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Shipping Defaults</h1>
      <p className="mt-1 text-sm text-gray-500">
        Fallback weight/dimensions used for shipping-rate lookups when a product doesn&apos;t have its own override.
        The &quot;__default__&quot; row is the store-wide fallback used when a category has no row of its own.
      </p>

      <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-[#FBFAF8] text-left text-xs uppercase tracking-[0.24em] text-gray-500">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Weight (kg)</th>
                <th className="p-3">Length (cm)</th>
                <th className="p-3">Breadth (cm)</th>
                <th className="p-3">Height (cm)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.category} className="border-t border-black/5">
                  <td className="p-3 font-medium text-[#111111]">
                    {row.category === "__default__" ? "Store-wide fallback" : row.category}
                  </td>
                  {(["weight", "length", "breadth", "height"] as const).map((field) => (
                    <td key={field} className="p-3">
                      <input
                        value={row[field]}
                        onChange={(e) => updateRow(i, field, e.target.value)}
                        className="w-20 rounded-[0.6rem] border border-black/10 px-2 py-1.5 text-sm"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-[#D94F70]">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 flex items-center gap-2 rounded-full bg-[#111111] px-6 py-2.5 text-sm text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  );
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
          {active === "homepage" && <HomepageEditor products={products} />}
          {active === "shipping-defaults" && <ShippingDefaultsEditor />}
        </main>
      </div>
    </div>
  );
}
