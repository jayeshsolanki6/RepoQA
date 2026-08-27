import { ApiError } from "../../utils/ApiError.js";

import { getConversation, getRecentMessages, saveMessage } from "./chat.repository.js";

import { retrievalService } from "../retrieval/retrieval.service.js";
import { llmService } from "./llm.service.js";

export const chatService = {
    ask: async (
        userId: string,
        repositoryId: string,
        conversationId: string,
        question: string
    ) => {
        const conversation = await getConversation(
            conversationId
        );

        if (
            !conversation ||
            conversation.userId !== userId ||
            conversation.repositoryId !== repositoryId
        ) {
            throw new ApiError(404, "Conversation not found");
        }

        await saveMessage(
            conversationId,
            "user",
            question
        );

        const chunks = await retrievalService.search(
            userId,
            repositoryId,
            question
        );

        const history = await getRecentMessages(
            conversationId,
            10
        );

        const answer = await llmService.generateAnswer(
            question,
            history,
            chunks
        );

        await saveMessage(
            conversationId,
            "assistant",
            answer
        );

        return {
            answer,
            sources: chunks.map((chunk) => ({
                filePath: chunk.filePath,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
            })),
        };
    },
};