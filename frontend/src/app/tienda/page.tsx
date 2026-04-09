"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { products as fallbackProducts } from "@/lib/data";
import { apiUrl } from "@/lib/api";
import { Objective, HairType, Product } from "@/lib/types";

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

  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [objective, setObjective] = useState<Objective | "">(initialObj);
  const [hairType, setHairType] = useState<HairType | "">("");
  const [priceRange, setPriceRange] = useState("");

  // Cargar productos desde API
  useEffect(() => {
    fetch(apiUrl("/api/products"))
      .then(r => r.json())
      .then(data => {
        const list = data.data ?? (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setProducts(list.filter((p: { is_active: boolean }) => p.is_active !== false).map((p: { slug: string; id: number; name: string; tagline: string; price: string; compare_price: string | null; category: string; stock: number; images: string[]; badges: string[]; benefits: string[]; for_whom: string; how_to_use: string; ingredients: string; hair_type: string[]; objective: string[] }) => ({
            id: p.slug || String(p.id), slug: p.slug || String(p.id), name: p.name,
            tagline: p.tagline ?? "", price: Number(p.price),
            comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
            images: p.images ?? [], badges: (p.badges ?? []) as Product["badges"],
            benefits: p.benefits ?? [], forWhom: p.for_whom ?? "",
            howToUse: p.how_to_use ? [p.how_to_use] : [], ingredients: p.ingredients ?? "",
            faq: [], category: (p.category ?? "kit") as Product["category"],
            objective: (p.objective ?? []) as Product["objective"],
            hairType: (p.hair_type ?? ["todos"]) as Product["hairType"],
            stock: p.stock ?? 0, crossSell: [],
          })));
        }
      })
      .catch(() => {});
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
  }, [objective, hairType, priceRange]);

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
      {filtered.length === 0 ? (
        <p className="text-humo text-center py-20">No hay productos con esos filtros. Intenta otra combinación.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
