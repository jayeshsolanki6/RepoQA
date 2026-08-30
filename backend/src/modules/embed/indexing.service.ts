import { loaderService } from "../loader/loader.service.js";
import { chunkService } from "../chunk/chunk.service.js";
import { generateEmbedding, generateEmbeddings } from "./embedding.service.js";
import { saveChunks } from "../chunk/chunk.repository.js";

const BATCH_SIZE = 50;

type ProgressCallback = (
    step: string,
    message: string
) => Promise<void>;

export const indexingService = {
    index: async (
        repositoryId: string,
        onProgress?: ProgressCallback
    ) => {
        await onProgress?.(
            "loading",
            "Reading repository files..."
        );

        const files =
            await loaderService.load(repositoryId);

        await onProgress?.(
            "chunking",
            "Creating code chunks..."
        );

        const chunks =
            chunkService.chunk(files);

        for (
            let i = 0;
            i < chunks.length;
            i += BATCH_SIZE
        ) {
            const batch = chunks.slice(
                i,
                i + BATCH_SIZE
            );

            await onProgress?.(
                "embedding",
                `Generating embeddings (${Math.min(
                    i + batch.length,
                    chunks.length
                )}/${chunks.length})...`
            );

            const embeddings =
                await generateEmbeddings(
                    batch.map((chunk) => chunk.content)
                );

            await onProgress?.(
                "saving",
                `Saving chunks (${Math.min(
                    i + batch.length,
                    chunks.length
                )}/${chunks.length})...`
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