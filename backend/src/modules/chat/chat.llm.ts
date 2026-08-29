import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MAX_RETRIES = 3;

export const llmService = {
  generateAnswer: async (
    question: string,
    history: { role: "user" | "assistant"; content: string }[],
    chunks: { filePath: string; startLine: number; endLine: number; content: string }[]
  ) => {
    const historyText = history
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join("\n\n");

    const contextText = chunks
      .map(
        (chunk, index) => `
SOURCE ${index + 1}
File: ${chunk.filePath}
Lines: ${chunk.startLine}-${chunk.endLine}

${chunk.content}
`
      )
      .join("\n");

    const prompt = `
You are RepoQA, an AI assistant that answers questions about a software repository.

Rules:
1. Answer using only the provided repository context.
2. Do not invent files, code, functions, or behavior.
3. Use the conversation history to understand follow-up questions.
4. Explain the answer clearly and concisely.
5. When referring to repository code, cite the file path and line range.
6. If the provided context is insufficient, say that you could not find enough evidence in the repository.

CONVERSATION HISTORY:
${historyText || "No previous conversation."}

REPOSITORY CONTEXT:
${contextText}

CURRENT QUESTION:
${question}
`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are a precise codebase question-answering assistant.",
          },
        });

        return response.text ?? "";
      } catch (err: any) {
        const isRateLimit = err?.status === 429;
        const isServerError = err?.status >= 500;
        const isRetryable = isRateLimit || isServerError;

        if (isRetryable && attempt < MAX_RETRIES) {
          const backoffMs = 1000 * 2 ** attempt; // 2s, 4s, 8s
          console.warn(`Gemini call failed (attempt ${attempt}), retrying in ${backoffMs}ms`, err.message);
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }

        console.error("Gemini generateContent failed:", err);
        throw new ApiError(502, "Failed to generate an answer. Please try again.");
      }
    }

    throw new ApiError(502, "Failed to generate an answer after multiple attempts.");
  },
};