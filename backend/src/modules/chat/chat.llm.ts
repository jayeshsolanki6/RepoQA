import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
      .map((chunk, index) => 
`
SOURCE ${index + 1}
File: ${chunk.filePath}
Lines: ${chunk.startLine}-${chunk.endLine}

${chunk.content}
`     )
      .join("\n");
      
const prompt = `
You have access to retrieved code from a repository the user is asking about.

RULES:
1. For specific factual questions about code (what a function does, where something is
   implemented, how a feature works), answer using only the provided repository context.
   Never invent files, functions, classes, or behavior that isn't shown.
2. For analytical or subjective questions (e.g. how complex or difficult the project would
   be to build, architectural assessments, code quality opinions, effort estimates), you may
   reason using the repository context available (tech stack, file structure, code patterns
   visible) combined with general software engineering judgment. Clearly frame these as an
   assessment or estimate, not a fact pulled from a specific file.
3. When referring to code, mention the relevant file name for context, but do not state
   specific line numbers yourself — exact citations are shown separately in the interface.
4. Use conversation history only to understand the user's follow-up questions.
5. If a specific factual question cannot be answered from the repository context, say:
   "I could not find enough evidence in the repository to answer this question."
   Do not apply this refusal to analytical/subjective questions — reason about those instead.
6. Do not claim that repository context was not provided if SOURCE sections are present.
7. If the question is unrelated to this repository, politely explain that you can only
   answer questions about the connected codebase.

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