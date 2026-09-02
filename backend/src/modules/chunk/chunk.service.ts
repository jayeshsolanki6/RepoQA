import { RepositoryFile, CodeChunk } from "./chunk.types.js";
import { createChunks } from "./chunk.slidingWindow.js";

export const chunkService = {
  chunk(files: RepositoryFile[]): CodeChunk[] {
    const chunks: CodeChunk[] = [];

    for (const file of files) {
      chunks.push(...createChunks(file));
    }

    // Defensive: never let an empty-content chunk through — the embedding
    // API rejects empty strings and would abort the whole indexing job.
    return chunks.filter((chunk) => chunk.content.trim().length > 0);
  },
};