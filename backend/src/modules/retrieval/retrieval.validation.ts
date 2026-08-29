import { z } from "zod";

export const searchSchema = z.object({
  question: z.string().min(1, "Question is required").max(2000, "Question is too long"),
});