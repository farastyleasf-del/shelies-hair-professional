import { query, queryOne } from "./db";

/* ── Crear tabla y seed inicial ── */
export async function initProductsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.products (
      id            SERIAL PRIMARY KEY,
      slug          VARCHAR(255) UNIQUE NOT NULL,
      name          VARCHAR(500) NOT NULL,
      tagline       TEXT         DEFAULT '',
      description   TEXT         DEFAULT '',
      price         NUMERIC(12,2) NOT NULL,
      compare_price NUMERIC(12,2),
      category      VARCHAR(100) DEFAULT '',
      stock         INTEGER      DEFAULT 0,
      images        JSONB        DEFAULT '[]',
      badges        JSONB        DEFAULT '[]',
      benefits      JSONB        DEFAULT '[]',
      for_whom      TEXT         DEFAULT '',
      how_to_use    TEXT         DEFAULT '',
      ingredients   TEXT         DEFAULT '',
      hair_type     JSONB        DEFAULT '[]',
      objective     JSONB        DEFAULT '[]',
      is_active     BOOLEAN      DEFAULT true,
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    )
  `, []);

  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM bbdd_shelies.products`, []);
  if (row && parseInt(row.count) > 0) { console.log("[products] tabla lista con datos existentes"); return; }

  const seed = [
    { slug: "shampoo-hidratante-blindaje",   name: "Shampoo Hidratante Blindaje",         tagline: "Limpieza hidratante sin efecto rigidez, control frizz desde el lavado", price: 27000,  category: "shampoo",     stock: 50, badges: ["bestseller"], benefits: ["Libre de sales","Tecnología Active Liss","Realinea la hebra en cada lavado","Controla el frizz","Mayor flexibilidad"], images: ["/images/products/shampoo-blindaje-pink.jpg","/images/products/shampoo-blindaje-white.jpg"], objective: ["control-frizz","brillo-suavidad"], hair_type: ["todos"], for_whom: "Cabello con frizz, sin movimiento o con rigidez. Ideal para uso diario.", how_to_use: "Humedece el cabello. Aplica en cuero cabelludo. Enjuaga. Complementa con Tratamiento Natural Blindaje.", ingredients: "" },
    { slug: "tratamiento-natural-blindaje",  name: "Tratamiento Natural Blindaje",         tagline: "Aceite de ricino + aloe vera para una suavidad efecto seda",                price: 27000,  category: "acondicionador", stock: 50, badges: ["bestseller"], benefits: ["Aceite de ricino y aloe vera","Suavidad efecto seda","Protege de agentes externos","Hidratación profunda","Brillo mágico"], images: ["/images/products/tratamiento-natural-teal.jpg","/images/products/tratamiento-natural.jpg"], objective: ["brillo-suavidad","reparacion"], hair_type: ["todos"], for_whom: "Todo tipo de cabello que necesita hidratación, suavidad y protección.", how_to_use: "Después del shampoo aplica de medios a puntas. Deja 3-5 min. Enjuaga con agua fría.", ingredients: "Aceite de ricino, Aloe vera, Proteínas hidrolizadas." },
    { slug: "protector-termico-blindaje",    name: "Protector Térmico Blindaje",           tagline: "Protección térmica en spray con perfume capilar + prolonga el alisado",     price: 30000,  category: "serum",       stock: 40, badges: ["new"],        benefits: ["Protección térmica todo el día","Sin sensación grasosa","Perfume capilar de larga duración","Prolonga el alisado","Controla el frizz y da brillo"], images: ["/images/products/protector-termico-white.jpg","/images/products/protector-termico.jpg"],      objective: ["control-frizz","brillo-suavidad"], hair_type: ["liso","ondulado","todos"], for_whom: "Cualquier cabello que use plancha, secador o rizadora.", how_to_use: "Aplica en spray sobre cabello húmedo o seco antes de usar calor.", ingredients: "" },
    { slug: "sheliss-therapy",               name: "Sheliss Therapy — Alisado Nutritivo",  tagline: "Alisado nutritivo 0% formol con extracto de karité, aminoácidos y óleos naturales", price: 320000, category: "kit",      stock: 15, badges: ["new"],        benefits: ["0% Formol — 100% seguro","Alisado nutritivo de larga duración","Extracto de Karité","Aminoácidos de queratina","Mezcla de óleos naturales"], images: ["/images/products/sheliss-therapy-modelo-a.jpg","/images/products/sheliss-therapy-purple.jpg"], objective: ["control-frizz","brillo-suavidad"], hair_type: ["ondulado","rizado","todos"], for_whom: "Cabellos con frizz, ondulados o rizados que buscan alisado nutritivo sin químicos agresivos.", how_to_use: "Lava con shampoo clarificante. Seca. Aplica sección a sección. Sella con plancha.", ingredients: "Extracto de Karité, Aminoácidos de Queratina, Óleos Naturales. 0% Formol." },
    { slug: "mascarilla-kanechom",           name: "Mascarillas Kanechom",                 tagline: "Hidratación, nutrición y reparación capilar en un solo producto",           price: 37000,  category: "mascarilla",  stock: 35, badges: ["bestseller"], benefits: ["3 en 1: Hidratación, Nutrición y Reparación","Ideal para todo tipo de cabello","Cambios radicales desde la primera aplicación","Acción profunda en la cutícula"], images: ["/images/products/kanechom-clean.png","/images/products/kanechom.jpg"], objective: ["brillo-suavidad","reparacion"], hair_type: ["todos"], for_whom: "Todo tipo de cabello. Cubre las principales necesidades capilares.", how_to_use: "Aplica en largo húmedo, no tocar cuero. Deja 30-40 min. Enjuaga.", ingredients: "" },
    { slug: "elixir-capilar",               name: "Elixir Capilar",                       tagline: "Tónico con células madre y ácido hialurónico que combate la caída sin minoxidil", price: 52000, category: "tonico",   stock: 30, badges: ["new"],        benefits: ["Combate la caída excesiva","Fortalece la hebra","Estimula el crecimiento","Sin minoxidil — sin dependencia","Células madre + ácido hialurónico"], images: ["/images/products/elixir-capilar-clean.png","/images/products/elixir-capilar.jpg"], objective: ["crecimiento-anticaida"], hair_type: ["todos"], for_whom: "Personas con caída excesiva, cabellos débiles o dificultad para crecer.", how_to_use: "Aplica sobre cuero cabelludo todas las noches con masaje suave.", ingredients: "Células madre, Ácido hialurónico." },
    { slug: "botox-capilar",                name: "Botox Capilar Canela",                 tagline: "Restauración, hidratación, brillo y transformación capilar con Canela, Moringa y Argán", price: 280000, category: "kit", stock: 20, badges: ["new"],     benefits: ["Restauración capilar","Hidratación capilar","Brillo intenso","Efecto anti-edad capilar","Canela + Moringa + Argán"], images: ["/images/products/botox-capilar.jpg"], objective: ["brillo-suavidad","reparacion"], hair_type: ["todos"], for_whom: "Cabellos procesados y maltratados. NO ALISA.", how_to_use: "Aplica sobre cabello limpio y húmedo. Sella con plancha. Lava a las 24-48h.", ingredients: "Canela, Moringa, Argán." },
    { slug: "tratamiento-reparador",        name: "Tratamiento Reparador Intensivo Shelie's", tagline: "Repara hasta un 80% en la primera sesión — keratina, biotina y proteínas al córtex capilar", price: 320000, category: "kit", stock: 15, badges: ["bestseller"], benefits: ["Vitamina B7, biotina, keratina, péptidos y proteínas","Penetra al córtex capilar","Recupera elasticidad 60-80%","Para cabello efecto chicle","NO ALISA"], images: ["/images/products/tratamiento-reparador.png"], objective: ["reparacion"], hair_type: ["muy-dañado","todos"], for_whom: "Cabellos con daños profundos, sin elasticidad (efecto chicle).", how_to_use: "Aplica sobre cabello limpio. Distribuye de medios a puntas. Deja 30-40 min. Sella con calor.", ingredients: "Vitamina B7, Biotina, Keratina, Péptidos, Proteínas." },
  ];

  for (const p of seed) {
    await query(
      `INSERT INTO bbdd_shelies.products (slug,name,tagline,price,category,stock,badges,benefits,images,objective,hair_type,for_whom,how_to_use,ingredients,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
       ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.name, p.tagline, p.price, p.category, p.stock,
       JSON.stringify(p.badges), JSON.stringify(p.benefits), JSON.stringify(p.images),
       JSON.stringify(p.objective), JSON.stringify(p.hair_type),
       p.for_whom, p.how_to_use, p.ingredients]
    );
  }
  console.log("[products] seed inicial insertado:", seed.length, "productos");
}

export interface DBProduct {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price: number;
  compare_price: number | null;
  category: string | null;
  stock: number;
  images: string[];
  badges: string[];
  benefits: string[];
  for_whom: string[];
  how_to_use: string | null;
  ingredients: string | null;
  hair_type: string[];
  objective: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TABLE = "bbdd_shelies.products";

export async function getProducts(onlyActive = true): Promise<DBProduct[]> {
  const where = onlyActive ? "WHERE is_active = true" : "";
  return query<DBProduct>(`SELECT * FROM ${TABLE} ${where} ORDER BY created_at DESC`);
}

export async function getProductBySlug(slug: string): Promise<DBProduct | null> {
  return queryOne<DBProduct>(`SELECT * FROM ${TABLE} WHERE slug = $1`, [slug]);
}

export async function createProduct(data: Omit<DBProduct, "id" | "created_at" | "updated_at">): Promise<DBProduct> {
  const rows = await query<DBProduct>(
    `INSERT INTO ${TABLE} (slug, name, tagline, description, price, compare_price, category, stock, images, badges, benefits, for_whom, how_to_use, ingredients, hair_type, objective, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [data.slug, data.name, data.tagline, data.description, data.price, data.compare_price,
     data.category, data.stock, JSON.stringify(data.images), JSON.stringify(data.badges),
     JSON.stringify(data.benefits), JSON.stringify(data.for_whom), data.how_to_use,
     data.ingredients, JSON.stringify(data.hair_type), JSON.stringify(data.objective), data.is_active]
  );
  return rows[0];
}

export async function updateProduct(id: number, data: Partial<DBProduct>): Promise<DBProduct | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const jsonFields = new Set(["images", "badges", "benefits", "for_whom", "hair_type", "objective"]);
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "created_at" || key === "updated_at") continue;
    fields.push(`${key} = $${i++}`);
    values.push(jsonFields.has(key) ? JSON.stringify(val) : val);
  }
  if (fields.length === 0) return null;
  fields.push(`updated_at = now()`);
  values.push(id);

  const rows = await query<DBProduct>(
    `UPDATE ${TABLE} SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}
