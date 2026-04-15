import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler, ApiError } from "../../middleware/errors.js";
import type { AuthenticatedRequest } from "../../types/index.js";
import { SearchSchema, UpdateSchema } from "./pricing.validator.js";
import { searchPricingRecords, editPricingRecord } from "./pricing.service.js";

const router = Router();

router.get(
  "/search",
  requireAuth(["admin", "editor", "viewer"]),
  asyncHandler(async (req, res) => {
    const parsed = SearchSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "Validation failed.", parsed.error.flatten());
    }
    const result = await searchPricingRecords(parsed.data);
    res.json(result);
  })
);

router.put(
  "/:id",
  requireAuth(["admin", "editor"]),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new ApiError(400, "Invalid record id.");
    }

    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Validation failed.", parsed.error.flatten());
    }

    const user = (req as AuthenticatedRequest).user;
    const updated = await editPricingRecord(
      id,
      parsed.data.productName,
      parsed.data.price,
      parsed.data.priceDate,
      parsed.data.version,
      user.id
    );

    res.json({ data: updated });
  })
);

export default router;
