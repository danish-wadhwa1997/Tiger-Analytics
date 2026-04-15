import { pool } from "../../config/db.js";

interface SearchParams {
  storeId?: string;
  sku?: string;
  productName?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

export async function searchPricingRecords(params: SearchParams) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  const push = (clause: string, value: unknown) => {
    values.push(value);
    clauses.push(`${clause} $${values.length}`);
  };

  if (params.storeId) push("store_id =", params.storeId);
  if (params.sku) push("sku =", params.sku);
  if (params.productName) push("product_name ILIKE", `%${params.productName}%`);
  if (params.minPrice !== undefined) push("price >=", params.minPrice);
  if (params.maxPrice !== undefined) push("price <=", params.maxPrice);
  if (params.startDate) push("price_date >=", params.startDate);
  if (params.endDate) push("price_date <=", params.endDate);

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const countValues = [...values];
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM pricing_record ${where}`,
    countValues
  );
  const total = Number(countResult.rows[0].total);

  values.push(params.pageSize, (params.page - 1) * params.pageSize);

  const dataResult = await pool.query(
    `SELECT id, store_id, sku, product_name, price, price_date, version, updated_at
     FROM pricing_record ${where}
     ORDER BY price_date DESC, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return {
    data: dataResult.rows,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

export async function findPricingRecordById(id: number) {
  const { rows } = await pool.query(
    "SELECT * FROM pricing_record WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function updatePricingRecord(
  id: number,
  productName: string,
  price: number,
  priceDate: string,
  expectedVersion: number
) {
  const result = await pool.query(
    `UPDATE pricing_record
     SET product_name = $1, price = $2, price_date = $3, version = version + 1, updated_at = NOW()
     WHERE id = $4 AND version = $5
     RETURNING *`,
    [productName, price, priceDate, id, expectedVersion]
  );
  return result.rows[0] ?? null;
}

export async function insertAuditRecord(
  recordId: number,
  changedBy: number,
  oldValue: unknown,
  newValue: unknown
) {
  await pool.query(
    "INSERT INTO pricing_record_audit (pricing_record_id, changed_by, old_value, new_value) VALUES ($1, $2, $3, $4)",
    [recordId, changedBy, JSON.stringify(oldValue), JSON.stringify(newValue)]
  );
}
