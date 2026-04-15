import { ApiError } from "../../middleware/errors.js";
import { pool } from "../../config/db.js";
import {
  findPricingRecordById,
  insertAuditRecord,
  searchPricingRecords,
  updatePricingRecord,
} from "./pricing.repository.js";

export { searchPricingRecords };

export async function editPricingRecord(
  id: number,
  productName: string,
  price: number,
  priceDate: string,
  expectedVersion: number,
  changedBy: number
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const oldRecord = await findPricingRecordById(id);
    if (!oldRecord) {
      throw new ApiError(404, "Pricing record not found.");
    }

    const updated = await updatePricingRecord(
      id,
      productName,
      price,
      priceDate,
      expectedVersion
    );

    if (!updated) {
      throw new ApiError(
        409,
        "Record was modified by another user. Please refresh and try again."
      );
    }

    await insertAuditRecord(id, changedBy, oldRecord, updated);

    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
