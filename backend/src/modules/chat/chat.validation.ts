import { z } from "zod";

export const askSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  question: z.string().min(1, "Question is required").max(2000, "Question is too long"),
});