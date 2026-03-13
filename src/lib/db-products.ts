import { query, queryOne } from "./db";

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

const TABLE = "shelies.products";

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
