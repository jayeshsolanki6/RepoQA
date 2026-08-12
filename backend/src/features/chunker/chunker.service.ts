import { RepositoryFile, CodeChunk } from "./types.js";
import { createChunks } from "./slidingWindow.js";

export const chunkerService = {
  chunk(files: RepositoryFile[]): CodeChunk[] {
    const chunks: CodeChunk[] = [];

    for (const file of files) {
      chunks.push(...createChunks(file));
    }

    return chunks;
  },
};