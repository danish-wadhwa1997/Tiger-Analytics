import { Router } from "express";
import { asyncHandler, ApiError } from "../../middleware/errors.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { LoginSchema } from "./auth.validator.js";
import { loginUser } from "./auth.service.js";

const router = Router();

router.post(
  "/login",
  rateLimit(60_000, 10),
  asyncHandler(async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Validation failed.", parsed.error.flatten());
    }

    const result = await loginUser(parsed.data.username, parsed.data.password);
    res.json(result);
  })
);

export default router;
