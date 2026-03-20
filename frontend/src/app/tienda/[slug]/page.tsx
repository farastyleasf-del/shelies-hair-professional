import { Metadata } from "next";
import Link from "next/link";
import { products } from "@/lib/data";
import ProductDetail from "@/components/ProductDetail";

const BASE = "https://shelies.com";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return { title: "Producto no encontrado — Shelie's" };

  return {
    title: `${product.name} — Shelie's Hair Professional`,
    description: product.tagline ?? `${product.name}: rutina capilar profesional`,
    openGraph: {
      title: `${product.name} — Shelie's`,
      description: product.tagline ?? "",
      images: product.images[0] ? [{ url: `${BASE}${product.images[0]}` }] : [],
      type: "website",
      locale: "es_CO",
      siteName: "Shelie's Hair Professional",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — Shelie's`,
      description: product.tagline ?? "",
      images: product.images[0] ? [`${BASE}${product.images[0]}`] : [],
    },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.slug === params.slug);

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-poppins font-bold text-2xl mb-3">Producto no encontrado</h1>
        <Link href="/tienda" className="btn-vino inline-block">Ir a la tienda</Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
