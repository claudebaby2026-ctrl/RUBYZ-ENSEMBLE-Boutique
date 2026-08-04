"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackageSearch } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getMyOrders, humanizeShipmentStatus, type Order } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const bg = ({
    Pending: "#B17F5E",
    Packed: "#5B7FBA",
    "Out for Delivery": "#D94F70",
    Delivered: "#3A9D5D",
    Rejected: "#999",
  } as Record<string, string>)[status] || "#999";
  return <span className="rounded-full px-2.5 py-1 text-[11px] text-white" style={{ background: bg }}>{status}</span>;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/orders");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMyOrders()
      .then(setOrders)
      .catch((e) => setError(e?.message || "Could not load your orders."))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FDF2EC]">
        <div className="flex items-center gap-2 text-sm text-[#8B7A6E]">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#FDF2EC]">
      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
        <h1 className="text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
          Your Orders
        </h1>
        <p className="mt-2 text-sm text-[#8B7A6E]">Every order you&apos;ve placed, with the latest shipment status.</p>

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-2 text-sm text-[#8B7A6E]">
            <Loader2 size={16} className="animate-spin" /> Loading your orders…
          </div>
        ) : error ? (
          <p className="mt-10 text-sm text-[#D94F70]">{error}</p>
        ) : orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 py-10 text-center">
            <PackageSearch size={36} className="text-[#B17F5E]" />
            <p className="text-sm text-[#8B7A6E]">You haven&apos;t placed any orders yet.</p>
            <Link href="/collections" className="rounded-full bg-[#3A2213] px-6 py-3 text-sm text-white">
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[1.4rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#3A2213]">{order.id}</p>
                    <p className="mt-1 text-xs text-[#A8968A]">
                      {new Date(order.createdAt).toLocaleString(undefined, {
                        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-3 text-sm text-[#7A6D65]">
                  {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#3A2213]">₹{order.total.toLocaleString()}</p>
                  <div className="text-right text-xs text-[#8B7A6E]">
                    <p>
                      Shipment: <span className="font-medium text-[#3A2213]">{humanizeShipmentStatus(order.shipmentStatus)}</span>
                    </p>
                    {order.awbCode && (
                      <p className="mt-0.5 text-[#A8968A]">
                        AWB {order.awbCode}{order.courierName ? ` · ${order.courierName}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
