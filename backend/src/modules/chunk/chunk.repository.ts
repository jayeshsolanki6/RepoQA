import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { codeChunks } from "../../db/schema/index.js";
import { ApiError } from "../../utils/ApiError.js";

interface SaveChunkInput {
    repositoryId: string;
    filePath: string;
    extension: string;
    content: string;
    startLine: number;
    endLine: number;
    embedding: number[];
}

export const saveChunks = async (chunks: SaveChunkInput[]) => {
    if (chunks.length === 0) {
        return;
    }

    try {
        await db
            .insert(codeChunks)
            .values(chunks);
    } catch (error: any) {
        const cause = (error as { cause?: unknown })?.cause as
            | { message?: string; code?: string; detail?: string }
            | undefined;

        throw new ApiError(
            500,
            cause?.message
                ? `Failed to save ${chunks.length} chunks: ${cause.message}`
                : `Failed to save ${chunks.length} chunks`
        );
    }
};

/* Indexing saves batch-by-batch, so a mid-run failure leaves partial rows.
   Clearing them before (re)indexing makes retries idempotent — no duplicates. */
export const deleteChunksByRepositoryId = async (repositoryId: string) => {
    await db
        .delete(codeChunks)
        .where(eq(codeChunks.repositoryId, repositoryId));
};