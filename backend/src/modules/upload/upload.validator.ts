import { z } from "zod";

export const UploadSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1),
});
