import { desc, eq, gt, cosineDistance } from "drizzle-orm";
import { db } from "../../db/index.js";
import { codeChunks } from "../../db/schema/index.js";

export const findSimilarChunks = async (
    repositoryId: string,
    queryEmbedding: number[],
    limit: number = 5
) => {
    const distance = cosineDistance(
        codeChunks.embedding,
        queryEmbedding
    );

    const results = await db
        .select({
            id: codeChunks.id,
            filePath: codeChunks.filePath,
            extension: codeChunks.extension,
            content: codeChunks.content,
            startLine: codeChunks.startLine,
            endLine: codeChunks.endLine,
            distance,
        })
        .from(codeChunks)
        .where(
            eq(codeChunks.repositoryId, repositoryId)
        )
        .orderBy(distance)
        .limit(limit);

    return results;
};