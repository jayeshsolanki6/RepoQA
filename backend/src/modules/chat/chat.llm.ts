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

You have access to retrieved code from the repository.

RULES:
1. Answer repository-related questions using the provided repository context.
2. Never invent files, functions, classes, variables, or behavior.
3. If the answer is present in the repository context, explain it clearly.
4. When mentioning repository code, always provide the file path and line range.
5. Use conversation history only to understand the user's follow-up questions.
6. If the repository context does not contain enough information to answer the question, say:
   "I could not find enough evidence in the repository to answer this question."
7. Do not claim that repository context was not provided if SOURCE sections are present.

CONVERSATION HISTORY:
${historyText || "No previous conversation."}

REPOSITORY CONTEXT:
${contextText || "No repository context was retrieved."}

CURRENT QUESTION:
${question}
`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-flash-lite-latest",
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