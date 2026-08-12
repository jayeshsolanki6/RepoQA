// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY!,
// });

// export const embeddingService = {

//     async generateEmbedding(text: string) {

//         const response = await ai.models.embedContent({
//             model: "gemini-embedding-001",
//             contents: text,
//         });

//         return response.embeddings?.[0].values ?? [];
//     },

// };