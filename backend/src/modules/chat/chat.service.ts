import { ApiError } from "../../utils/ApiError.js";

import { deleteConversationById, getAllMessages, getConversation, getConversationsByRepository, getRecentMessages, saveMessage } from "./chat.repository.js";

import { retrievalService } from "../retrieval/retrieval.service.js";
import { llmService } from "./chat.llm.js";

export const chatService = {
    ask: async (userId: string, repositoryId: string, conversationId: string, question: string) => {
        const conversation = await getConversation(
            conversationId
        );

        if (!conversation || conversation.userId !== userId || conversation.repositoryId !== repositoryId) {
            throw new ApiError(404, "Conversation not found");
        }

        await saveMessage(conversationId, "user", question);

        const chunks = await retrievalService.search(userId, repositoryId, question);

        const history = await getRecentMessages(conversationId, 10);

        const answer = await llmService.generateAnswer(question, history, chunks);

        await saveMessage(conversationId, "assistant", answer);

        return {
            answer,
        };
    },

    listConversations: async (userId: string, repositoryId: string) => {
        return await getConversationsByRepository(userId, repositoryId);
    },

    getMessages: async (userId: string, conversationId: string) => {
        const conversation = await getConversation(conversationId);

        if (!conversation || conversation.userId !== userId) {
            throw new ApiError(404, "Conversation not found");
        }

        return await getAllMessages(conversationId);
    },

    deleteConversation: async (userId: string, conversationId: string) => {
        const conversation = await getConversation(conversationId);

        if (!conversation || conversation.userId !== userId) {
            throw new ApiError(404, "Conversation not found");
        }

        await deleteConversationById(conversationId);
    },
};