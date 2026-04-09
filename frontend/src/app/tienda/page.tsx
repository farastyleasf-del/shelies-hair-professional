"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { products as fallbackProducts } from "@/lib/data";
import { Objective, HairType, Product, Badge, Category } from "@/lib/types";

const objectives: { value: Objective | ""; label: string }[] = [
  { value: "", label: "Todos los objetivos" },
  { value: "control-frizz", label: "Control frizz" },
  { value: "brillo-suavidad", label: "Brillo y suavidad" },
  { value: "reparacion", label: "Reparación" },
  { value: "crecimiento-anticaida", label: "Crecimiento & Anti-caída" },
];

const hairTypes: { value: HairType | ""; label: string }[] = [
  { value: "", label: "Todos los tipos" },
  { value: "liso", label: "Liso" },
  { value: "ondulado", label: "Ondulado" },
  { value: "rizado", label: "Rizado" },
  { value: "muy-dañado", label: "Muy dañado" },
];

const priceRanges = [
  { value: "", label: "Cualquier precio" },
  { value: "0-30000", label: "Hasta $30.000" },
  { value: "30000-60000", label: "$30.000 – $60.000" },
  { value: "60000-999999", label: "Más de $60.000" },
];

function mapDBProduct(p: Record<string, unknown>): Product {
  return {
    id: (p.slug as string) || String(p.id),
    slug: (p.slug as string) || String(p.id),
    name: (p.name as string) ?? "",
    tagline: (p.tagline as string) ?? "",
    price: Number(p.price),
    comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
    images: (p.images as string[]) ?? [],
    badges: ((p.badges as string[]) ?? []) as Badge[],
    benefits: (p.benefits as string[]) ?? [],
    forWhom: (p.for_whom as string) ?? "",
    howToUse: p.how_to_use ? (typeof p.how_to_use === "string" ? [p.how_to_use as string] : p.how_to_use as string[]) : [],
    ingredients: (p.ingredients as string) ?? "",
    faq: [],
    category: ((p.category as string) ?? "kit") as Category,
    objective: ((p.objective as string[]) ?? []) as Objective[],
    hairType: ((p.hair_type as string[]) ?? ["todos"]) as HairType[],
    stock: (p.stock as number) ?? 0,
    crossSell: [],
  };
}

export default function TiendaPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10"><p className="text-humo">Cargando tienda...</p></div>}>
      <TiendaContent />
    </Suspense>
  );
}

function TiendaContent() {
  const searchParams = useSearchParams();
  const initialObj = (searchParams.get("objective") as Objective) || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [objective, setObjective] = useState<Objective | "">(initialObj);
  const [hairType, setHairType] = useState<HairType | "">("");
  const [priceRange, setPriceRange] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const list = data.data ?? (Array.isArray(data) ? data : []);
        const active = list.filter((p: Record<string, unknown>) => p.is_active !== false);
        if (active.length > 0) {
          setProducts(active.map(mapDBProduct));
        } else {
          setProducts(fallbackProducts);
        }
      })
      .catch(() => { if (!cancelled) setProducts(fallbackProducts); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (objective) list = list.filter((p) => p.objective.includes(objective));
    if (hairType) list = list.filter((p) => p.hairType.includes(hairType) || p.hairType.includes("todos"));
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      list = list.filter((p) => p.price >= min && p.price <= max);
    }
    return list;
  }, [products, objective, hairType, priceRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-poppins font-bold text-3xl mb-2">Tienda</h1>
      <p className="text-humo text-sm mb-8">Encuentra la rutina perfecta para tu cabello</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value as Objective | "")}
          className="bg-white border border-blush/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
        >
          {objectives.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={hairType}
          onChange={(e) => setHairType(e.target.value as HairType | "")}
          className="bg-white border border-blush/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
        >
          {hairTypes.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>
        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="bg-white border border-blush/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
        >
          {priceRanges.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {!loaded ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-blush/20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-poppins font-semibold text-lg">No encontramos productos con esos filtros</p>
          <p className="text-humo text-sm mt-1">Intenta con otros criterios</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
