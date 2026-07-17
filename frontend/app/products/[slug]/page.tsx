import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, resolveImageUrl } from "@/lib/api";
import { AnimatedProductCard } from "@/components/ui/animated-product-card";
import { AddToCartPanel } from "@/components/product/add-to-cart-panel";
import { LikeButton } from "@/components/product/like-button";
import { ProductImageGallery } from "@/components/product/product-image-gallery";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: "Product Details",
    description: "Luxury boutique product details with fabric, care and availability information.",
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  const related = allProducts.filter((item) => item.id !== product.id).slice(0, 4);
  const images = (product.images ?? []).map((img) => resolveImageUrl(img)).filter(Boolean) as string[];
  const mainImage = images[0];

  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(17,17,17,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-[#111111] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white">{product.badge}</span>
              <LikeButton productId={product.id} className="rounded-full border border-black/10 p-2" />
            </div>
            {mainImage ? (
              <ProductImageGallery images={images} alt={product.name} />
            ) : (
              <div className="h-[440px] rounded-[1.4rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Featured Piece</p>
            <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              {product.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-600">{product.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#F8F5F1] px-3 py-1 text-sm text-[#111111]">{product.category}</span>
              <span className="rounded-full bg-[#F8F5F1] px-3 py-1 text-sm text-[#111111]">{product.fabric}</span>
              <span className="rounded-full bg-[#F8F5F1] px-3 py-1 text-sm text-[#111111]">{product.occasion}</span>
            </div>

            <div className="mt-8 flex items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Price</p>
                <p className="text-3xl text-[#111111]">₹{product.price}</p>
              </div>
              <p className="text-sm text-gray-400 line-through">₹{product.mrp}</p>
            </div>

            <AddToCartPanel product={product} image={images[0]} />

            <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="text-xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Product Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Fabric</p>
                  <p className="mt-1 text-sm text-gray-600">{product.fabric}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Availability</p>
                  <p className="mt-1 text-sm text-gray-600">{product.availability}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Sizes</p>
                  <p className="mt-1 text-sm text-gray-600">{product.sizes.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Care</p>
                  <p className="mt-1 text-sm text-gray-600">{product.care.join(" • ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#B68D40]">Related Pieces</p>
            <h2 className="text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
              You may also love
            </h2>
          </div>
          <Link href="/collections" className="text-sm uppercase tracking-[0.28em] text-[#111111] hover:text-[#B68D40]">View All</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <AnimatedProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
