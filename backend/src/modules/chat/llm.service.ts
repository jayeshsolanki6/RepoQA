import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export const llmService = {
    generateAnswer: async (
        question: string,
        history: {
            role: "user" | "assistant";
            content: string;
        }[],
        chunks: {
            filePath: string;
            startLine: number;
            endLine: number;
            content: string;
        }[]
    ) => {
        const historyText = history
            .map(
                (message) =>
                    `${message.role.toUpperCase()}: ${message.content}`
            )
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

        const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
                systemInstruction:
                    "You are a precise codebase question-answering assistant.",
            },
        });

        return response.text ?? "";
    },
};