import { z } from "zod";

export const createRepositorySchema = z.object({
    githubUrl: z.string().url("Invalid GitHub URL")
});

export type CreateRepositorySchema = z.infer<typeof createRepositorySchema>;