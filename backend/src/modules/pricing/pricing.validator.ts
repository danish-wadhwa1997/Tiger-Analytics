import { z } from "zod";

export const SearchSchema = z.object({
  storeId: z.string().optional(),
  sku: z.string().optional(),
  productName: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const UpdateSchema = z.object({
  productName: z.string().min(1),
  price: z.number().positive(),
  priceDate: z.string(),
  version: z.number().int().nonnegative(),
});
