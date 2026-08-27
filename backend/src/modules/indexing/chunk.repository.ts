// import { db } from "../../db/index.js";
// import { codeChunks } from "../../db/schema/index.js";

// interface SaveChunkInput {
//     repositoryId: string;
//     filePath: string;
//     extension: string;
//     content: string;
//     startLine: number;
//     endLine: number;
//     embedding: number[];
// }

// export const saveChunk = async (data: SaveChunkInput) => {
//     const result = await db
//         .insert(codeChunks)
//         .values(data)
//         .returning();

//     return result[0];
// };

import { db } from "../../db/index.js";
import { codeChunks } from "../../db/schema/index.js";

interface SaveChunkInput {
    repositoryId: string;
    filePath: string;
    extension: string;
    content: string;
    startLine: number;
    endLine: number;
    embedding: number[];
}

export const saveChunks = async (
    chunks: SaveChunkInput[]
) => {
    if (chunks.length === 0) {
        return;
    }

    await db
        .insert(codeChunks)
        .values(chunks);
};