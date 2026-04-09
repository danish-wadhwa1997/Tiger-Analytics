import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import { parse } from "csv-parse/sync";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { Pool } from "pg";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "local-dev-secret-change-me";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/pricingdb"
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

type UserRole = "admin" | "editor" | "viewer";
type AuthUser = { id: number; username: string; role: UserRole };

const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const SearchSchema = z.object({
  storeId: z.string().optional(),
  sku: z.string().optional(),
  productName: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

const UpdateSchema = z.object({
  productName: z.string().min(1),
  price: z.number().positive(),
  priceDate: z.string()
});

const UploadSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1)
});

function auth(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing bearer token." });
      return;
    }
    try {
      const token = authHeader.replace("Bearer ", "");
      const payload = jwt.verify(token, jwtSecret) as AuthUser;
      if (!allowedRoles.includes(payload.role)) {
        res.status(403).json({ error: "Insufficient permissions." });
        return;
      }
      (req as Request & { user: AuthUser }).user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token." });
    }
  };
}

app.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

app.post("/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { rows } = await pool.query(
    "SELECT id, username, password_hash, role FROM app_user WHERE username = $1",
    [parsed.data.username]
  );
  const user = rows[0];
  if (!user) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role as UserRole },
    jwtSecret,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.post("/pricing/upload", auth(["admin", "editor"]), async (req, res) => {
  const parsedUpload = UploadSchema.safeParse(req.body);
  if (!parsedUpload.success) {
    res.status(400).json({ error: parsedUpload.error.flatten() });
    return;
  }

  const { csvContent, fileName } = parsedUpload.data;
  const records = parse(csvContent, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const uploadResult = await client.query(
      "INSERT INTO feed_upload (file_name, uploaded_by, row_count, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [fileName, (req as Request & { user: AuthUser }).user.id, records.length, "processed"]
    );
    const feedUploadId = uploadResult.rows[0].id as number;

    for (const row of records) {
      const storeId = row["Store ID"]?.trim();
      const sku = row["SKU"]?.trim();
      const productName = row["Product Name"]?.trim();
      const price = Number(row["Price"]);
      const priceDate = row["Date"]?.trim();
      if (!storeId || !sku || !productName || Number.isNaN(price) || !priceDate) {
        throw new Error("Invalid CSV row detected.");
      }

      await client.query(
        `INSERT INTO pricing_record (store_id, sku, product_name, price, price_date, source_feed_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (store_id, sku, price_date)
         DO UPDATE SET product_name = EXCLUDED.product_name, price = EXCLUDED.price, updated_at = NOW()`,
        [storeId, sku, productName, price, priceDate, feedUploadId]
      );
    }
    await client.query("COMMIT");
    res.json({ message: "Upload processed successfully.", rowsProcessed: records.length });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error instanceof Error ? error.message : "Upload failed." });
  } finally {
    client.release();
  }
});

app.get("/pricing/search", auth(["admin", "editor", "viewer"]), async (req, res) => {
  const parsed = SearchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { storeId, sku, productName, minPrice, maxPrice, startDate, endDate, page, pageSize } = parsed.data;

  const clauses: string[] = [];
  const values: unknown[] = [];
  const push = (clause: string, value: unknown) => {
    values.push(value);
    clauses.push(`${clause} $${values.length}`);
  };

  if (storeId) push("store_id =", storeId);
  if (sku) push("sku =", sku);
  if (productName) push("product_name ILIKE", `%${productName}%`);
  if (minPrice !== undefined) push("price >=", minPrice);
  if (maxPrice !== undefined) push("price <=", maxPrice);
  if (startDate) push("price_date >=", startDate);
  if (endDate) push("price_date <=", endDate);

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  values.push(pageSize, (page - 1) * pageSize);

  const result = await pool.query(
    `SELECT id, store_id, sku, product_name, price, price_date, updated_at
     FROM pricing_record ${whereClause}
     ORDER BY price_date DESC, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({ data: result.rows, page, pageSize });
});

app.put("/pricing/:id", auth(["admin", "editor"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid record id." });
    return;
  }
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const oldRecordRes = await client.query("SELECT * FROM pricing_record WHERE id = $1", [id]);
    if (oldRecordRes.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Pricing record not found." });
      return;
    }
    const oldRecord = oldRecordRes.rows[0];

    const { productName, price, priceDate } = parsed.data;
    const updatedRecord = await client.query(
      `UPDATE pricing_record
       SET product_name = $1, price = $2, price_date = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [productName, price, priceDate, id]
    );

    await client.query(
      "INSERT INTO pricing_record_audit (pricing_record_id, changed_by, old_value, new_value) VALUES ($1, $2, $3, $4)",
      [
        id,
        (req as Request & { user: AuthUser }).user.id,
        JSON.stringify(oldRecord),
        JSON.stringify(updatedRecord.rows[0])
      ]
    );
    await client.query("COMMIT");
    res.json({ data: updatedRecord.rows[0] });
  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to update pricing record." });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on port ${port}`);
});
