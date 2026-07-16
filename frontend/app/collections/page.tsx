import { CollectionsExplorer } from "@/components/collections/collections-explorer";
import { getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collections",
  description: "Browse premium ethnic fashion collections with luxury filters and thoughtful curation.",
};

export default async function CollectionsPage() {
  const products = await getProducts();
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <CollectionsExplorer products={products} />
      </section>
    </main>
  );
}