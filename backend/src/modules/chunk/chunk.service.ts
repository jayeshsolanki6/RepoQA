import { RepositoryFile, CodeChunk } from "./chunk.types.js";
import { createChunks } from "./chunk.slidingWindow.js";

export const chunkService = {
  chunk(files: RepositoryFile[]): CodeChunk[] {
    const chunks: CodeChunk[] = [];

    for (const file of files) {
      chunks.push(...createChunks(file));
    }

    return chunks;
  },
};