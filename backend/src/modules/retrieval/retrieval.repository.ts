import { eq, and, cosineDistance, lt } from "drizzle-orm";
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
            // and(
                eq(codeChunks.repositoryId, repositoryId),
            //     lt(distance, 0.5) //lower cosine distance = more similar
            // )
        )
        .orderBy(distance)
        .limit(limit);

    return results;
};