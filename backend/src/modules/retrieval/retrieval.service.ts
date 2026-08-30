import { generateEmbedding } from "../embed/embedding.service.js";
import { findSimilarChunks } from "./retrieval.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { getRepositoryById } from "../repository/repository.repository.js";

export const retrievalService = {
    search: async (
        userId: string,
        repositoryId: string,
        question: string
    ) => {
        const repository = await getRepositoryById(repositoryId);

        if (!repository || repository.userId !== userId) {
            throw new ApiError(404, "Repository not found");
        }

        if (!question.trim()) {
            throw new ApiError(400, "Question is required");
        }

        const queryEmbedding =
            await generateEmbedding(question);

        const chunks = await findSimilarChunks(
            repositoryId,
            queryEmbedding,
            5
        );

        return chunks;
    },
};