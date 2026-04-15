import { parse } from "csv-parse/sync";
import { pool } from "../../config/db.js";
import { ApiError } from "../../middleware/errors.js";

const BATCH_SIZE = 500;

interface CsvRow {
  "Store ID": string;
  SKU: string;
  "Product Name": string;
  Price: string;
  Date: string;
}

function validateRow(row: CsvRow, lineNum: number) {
  const storeId = row["Store ID"]?.trim();
  const sku = row["SKU"]?.trim();
  const productName = row["Product Name"]?.trim();
  const price = Number(row["Price"]);
  const priceDate = row["Date"]?.trim();

  if (!storeId || !sku || !productName || Number.isNaN(price) || price <= 0 || !priceDate) {
    throw new ApiError(400, `Invalid data at CSV line ${lineNum + 2}.`);
  }

  return { storeId, sku, productName, price, priceDate };
}

function buildBatchUpsertQuery(
  rows: ReturnType<typeof validateRow>[],
  feedUploadId: number
) {
  const values: unknown[] = [];
  const placeholders: string[] = [];

  for (const row of rows) {
    const offset = values.length;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
    );
    values.push(
      row.storeId,
      row.sku,
      row.productName,
      row.price,
      row.priceDate,
      feedUploadId
    );
  }

  const sql = `
    INSERT INTO pricing_record (store_id, sku, product_name, price, price_date, source_feed_id)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (store_id, sku, price_date)
    DO UPDATE SET
      product_name = EXCLUDED.product_name,
      price = EXCLUDED.price,
      updated_at = NOW()
  `;

  return { sql, values };
}

export async function processUpload(
  csvContent: string,
  fileName: string,
  userId: number
): Promise<{ rowsProcessed: number }> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CsvRow[];

  if (records.length === 0) {
    throw new ApiError(400, "CSV file is empty.");
  }

  const validated = records.map((row, i) => validateRow(row, i));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const uploadRes = await client.query(
      "INSERT INTO feed_upload (file_name, uploaded_by, row_count, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [fileName, userId, records.length, "processed"]
    );
    const feedUploadId = uploadRes.rows[0].id as number;

    for (let i = 0; i < validated.length; i += BATCH_SIZE) {
      const batch = validated.slice(i, i + BATCH_SIZE);
      const { sql, values } = buildBatchUpsertQuery(batch, feedUploadId);
      await client.query(sql, values);
    }

    await client.query("COMMIT");
    return { rowsProcessed: records.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
