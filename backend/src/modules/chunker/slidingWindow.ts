import { CodeChunk, RepositoryFile } from "./types.js";

const MAX_CHARS = 3000;        // approx char budget per chunk
const OVERLAP_LINES = 15;      // lines repeated between consecutive chunks
const MIN_CHUNK_LINES = 5;     // avoid tiny leftover tail chunks

export const createChunks = (file: RepositoryFile): CodeChunk[] => {
  const { path, extension, content } = file;

  // Small file → keep it as a single whole chunk, preserves full context
  if (content.length <= MAX_CHARS) {
    return [
      {
        filePath: path,
        extension,
        content,
        startLine: 1,
        endLine: content.split("\n").length,
      },
    ];
  }

  const lines = content.split("\n");
  const chunks: CodeChunk[] = [];

  let cursor = 0; // 0-indexed line pointer

  while (cursor < lines.length) {
    let endLine = cursor;
    let charCount = 0;

    // Grow the window line-by-line until we hit the char budget or EOF
    while (endLine < lines.length && charCount < MAX_CHARS) {
      charCount += lines[endLine].length + 1; // +1 accounts for the stripped newline
      endLine++;
    }

    const chunkLines = lines.slice(cursor, endLine);
    const chunkContent = chunkLines.join("\n");

    // Skip empty/whitespace-only windows (e.g. trailing blank lines)
    if (chunkContent.trim().length === 0) {
      if (endLine >= lines.length) break;
      cursor = endLine;
      continue;
    }

    // Merge a too-small tail chunk into the previous one instead of
    // pushing a near-duplicate, low-value chunk
    const isTinyTail = chunkLines.length < MIN_CHUNK_LINES && chunks.length > 0 && endLine >= lines.length;

    if (isTinyTail) {
      const prev = chunks[chunks.length - 1];
      const prevLines = prev.content.split("\n");
      const mergedLines = [...prevLines, ...chunkLines];
      prev.content = mergedLines.join("\n");
      prev.endLine = endLine;
    } else {
      chunks.push({
        filePath: path,
        extension,
        content: chunkContent,
        startLine: cursor + 1,
        endLine,
      });
    }

    if (endLine >= lines.length) break; // reached end of file, stop

    // Step forward, stepping back by OVERLAP_LINES for context continuity.
    // Guaranteed to advance by at least 1 line to avoid infinite loops on
    // pathological cases (e.g. a single line longer than MAX_CHARS).
    const nextCursor = endLine - OVERLAP_LINES;
    cursor = Math.max(nextCursor, cursor + 1);
  }

  return chunks;
};