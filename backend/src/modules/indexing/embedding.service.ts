// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY!,
// });

// export const embeddingService = {
//     generateEmbedding: async (text: string): Promise<number[]> => {
//         const response = await ai.models.embedContent({
//             model: "gemini-embedding-001",
//             contents: text,
//         });

//         const embedding = response.embeddings?.[0]?.values;

//         if (!embedding) {
//             throw new Error("Failed to generate embedding");
//         }

//         return embedding;
//     },
// };

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = "gemini-embedding-001";

export const embeddingService = {
    generateEmbedding: async (text: string): Promise<number[]> => {
        const response = await ai.models.embedContent({
            model: MODEL,
            contents: text,
            config: {
                taskType: "RETRIEVAL_QUERY",
            },
        });

        const embedding = response.embeddings?.[0]?.values;

        if (!embedding) {
            throw new Error("Failed to generate embedding");
        }

        return embedding;
    },

    generateEmbeddings: async (
        texts: string[]
    ): Promise<number[][]> => {
        if (texts.length === 0) {
            return [];
        }

        const response = await ai.models.embedContent({
            model: MODEL,
            contents: texts,
            config: {
                taskType: "RETRIEVAL_DOCUMENT",
            },
        });

        const embeddings = response.embeddings?.map(
            (embedding) => embedding.values
        );

        if (
            !embeddings ||
            embeddings.length !== texts.length ||
            embeddings.some((embedding) => !embedding)
        ) {
            throw new Error("Failed to generate embeddings");
        }

        return embeddings as number[][];
    },
};