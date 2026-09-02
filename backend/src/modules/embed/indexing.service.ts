import { loaderService } from "../loader/loader.service.js";
import { chunkService } from "../chunk/chunk.service.js";
import { generateEmbeddings } from "./embedding.service.js";
import { saveChunks, deleteChunksByRepositoryId } from "../chunk/chunk.repository.js";

const BATCH_SIZE = 50;

type ProgressCallback = (step: string, message: string) => Promise<void>;

export const indexingService = {
    index: async (repositoryId: string, onProgress?: ProgressCallback) => {
        // A previous failed run may have left partial chunks behind; starting
        // clean keeps retries duplicate-free.
        await deleteChunksByRepositoryId(repositoryId);

        await onProgress?.(
            "loading",
            "Reading repository files..."
        );

        const files = await loaderService.load(repositoryId);

        await onProgress?.(
            "chunking",
            "Creating code chunks..."
        );

        const chunks = chunkService.chunk(files);

        const total = chunks.length;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            // Report what has actually been embedded so far (not including
            // the upcoming batch). The embedding service advances this count
            // after every 20-chunk sub-request via onProgress.
            await onProgress?.(
                "embedding",
                `Generating embeddings (${i}/${total})...`
            );

            const embeddings =
                await generateEmbeddings(
                    batch.map((chunk) => chunk.content),
                    {
                        startOffset: i,
                        total,
                        onProgress: (processed) => {
                            void onProgress?.(
                                "embedding",
                                `Generating embeddings (${processed}/${total})...`
                            );
                        },
                    }
                );

            // Persist each finished batch so a mid-run crash keeps the work
            // done so far. Saving is fast, so it is surfaced as a single step
            // at the end instead of flipping the UI after every batch.
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

        await onProgress?.(
            "saving",
            `Saving vectors (${total}/${total})...`
        );

        return {
            files: files.length,
            chunks: chunks.length,
        };
    },
};