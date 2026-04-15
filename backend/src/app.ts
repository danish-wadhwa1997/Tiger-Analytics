import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { globalErrorHandler } from "./middleware/errors.js";
import { pool } from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import pricingRoutes from "./modules/pricing/pricing.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/pricing/upload", uploadRoutes);
app.use("/pricing", pricingRoutes);

app.use(globalErrorHandler);

export default app;
