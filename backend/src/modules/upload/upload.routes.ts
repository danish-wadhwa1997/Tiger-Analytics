import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler, ApiError } from "../../middleware/errors.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import type { AuthenticatedRequest } from "../../types/index.js";
import { UploadSchema } from "./upload.validator.js";
import { processUpload } from "./upload.service.js";

const router = Router();

router.post(
  "/",
  requireAuth(["admin", "editor"]),
  rateLimit(60_000, 20),
  asyncHandler(async (req, res) => {
    const parsed = UploadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Validation failed.", parsed.error.flatten());
    }

    const user = (req as AuthenticatedRequest).user;
    const result = await processUpload(
      parsed.data.csvContent,
      parsed.data.fileName,
      user.id
    );

    res.json({ message: "Upload processed successfully.", ...result });
  })
);

export default router;
