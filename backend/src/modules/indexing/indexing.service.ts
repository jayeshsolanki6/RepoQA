// import { loaderService } from "../loader/loader.service.js";
// import { chunkerService } from "../chunker/chunker.service.js";
// import { embeddingService } from "./embedding.service.js";
// import { saveChunk } from "./chunk.repository.js";

// export const indexingService = {
//     index: async (repositoryId: string) => {
//         const files = await loaderService.load(repositoryId);

//         const chunks = chunkerService.chunk(files);

//         for (const chunk of chunks) {
//             const embedding =
//                 await embeddingService.generateEmbedding(
//                     chunk.content
//                 );

//             await saveChunk({
//                 repositoryId,
//                 filePath: chunk.filePath,
//                 extension: chunk.extension,
//                 content: chunk.content,
//                 startLine: chunk.startLine,
//                 endLine: chunk.endLine,
//                 embedding,
//             });
//         }

//         return {
//             files: files.length,
//             chunks: chunks.length,
//         };
//     },
// };


// import { loaderService } from "../loader/loader.service.js";
// import { chunkerService } from "../chunker/chunker.service.js";
// import { embeddingService } from "./embedding.service.js";
// import { saveChunk } from "./chunk.repository.js";

// const BATCH_SIZE = 50;

// export const indexingService = {
//     index: async (repositoryId: string) => {
//         const files = await loaderService.load(repositoryId);

//         const chunks = chunkerService.chunk(files);

//         let processedChunks = 0;

//         for (
//             let i = 0;
//             i < chunks.length;
//             i += BATCH_SIZE
//         ) {
//             const batch = chunks.slice(
//                 i,
//                 i + BATCH_SIZE
//             );

//             console.log(
//                 `Generating embeddings: ${i + 1}-${i + batch.length} / ${chunks.length}`
//             );

//             const embeddings =
//                 await embeddingService.generateEmbeddings(
//                     batch.map((chunk) => chunk.content)
//                 );

//             for (let j = 0; j < batch.length; j++) {
//                 await saveChunk({
//                     repositoryId,
//                     filePath: batch[j].filePath,
//                     extension: batch[j].extension,
//                     content: batch[j].content,
//                     startLine: batch[j].startLine,
//                     endLine: batch[j].endLine,
//                     embedding: embeddings[j],
//                 });

//                 processedChunks++;
//             }
//         }

//         return {
//             files: files.length,
//             chunks: chunks.length,
//             processedChunks,
//         };
//     },
// };


import { loaderService } from "../loader/loader.service.js";
import { chunkerService } from "../chunker/chunker.service.js";
import { embeddingService } from "./embedding.service.js";
import { saveChunks } from "./chunk.repository.js";

const BATCH_SIZE = 50;

export const indexingService = {
    index: async (repositoryId: string) => {
        const files = await loaderService.load(repositoryId);

        const chunks = chunkerService.chunk(files);

        for (
            let i = 0;
            i < chunks.length;
            i += BATCH_SIZE
        ) {
            const batch = chunks.slice(
                i,
                i + BATCH_SIZE
            );

            console.log(
                `Processing ${i + 1}-${i + batch.length} / ${chunks.length}`
            );

            const embeddings =
                await embeddingService.generateEmbeddings(
                    batch.map((chunk) => chunk.content)
                );

            await saveChunks(
                batch.map((chunk, index) => ({
                    repositoryId,
                    filePath: chunk.filePath,
                    extension: chunk.extension,
                    content: chunk.content,
                    startLine: chunk.startLine,
                    endLine: chunk.endLine,
                    embedding: embeddings[index],
                }))
            );
        }

        return {
            files: files.length,
            chunks: chunks.length,
        };
    },
};