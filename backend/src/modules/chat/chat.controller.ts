import type { NextFunction, Request, Response } from "express";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { chatService } from "./chat.service.js";
import { createConversation } from "./chat.repository.js";
import { getRepositoryById } from "../repository/repository.repository.js";
import { ApiError } from "../../utils/ApiError.js";

export const ask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repositoryId = req.params.repositoryId as string;

        const { conversationId, question } = req.body;

        const result = await chatService.ask(req.user.userId, repositoryId, conversationId, question);

        res.status(200).json(
            new ApiResponse(
                "Answer generated successfully",
                result
            )
        );
    } catch (error) {
        next(error);
    }
};

export const createChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repositoryId = req.params.repositoryId as string;
        const repository = await getRepositoryById(repositoryId);

        if (!repository || repository.userId !== req.user.userId) {
            throw new ApiError(404, "Repository not found");
        }

        const conversation = await createConversation(req.user.userId, repositoryId);

        res.status(201).json(
            new ApiResponse(
                "Conversation created successfully",
                conversation
            )
        );
    } catch (error) {
        next(error);
    }
};

export const listConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repositoryId = req.params.repositoryId as string;

        const conversations = await chatService.listConversations(req.user.userId, repositoryId);

        res.status(200).json(
            new ApiResponse(
                "Conversations fetched successfully", 
                conversations
            )
        );
    } catch (error) {
        next(error);
    }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const conversationId = req.params.conversationId as string;

        const messages = await chatService.getMessages(req.user.userId, conversationId);

        res.status(200).json(
            new ApiResponse("Messages fetched successfully", messages)
        );
    } catch (error) {
        next(error);
    }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const conversationId = req.params.conversationId as string;

        await chatService.deleteConversation(req.user.userId, conversationId);

        res.status(200).json(
            new ApiResponse("Conversation deleted successfully", null)
        );
    } catch (error) {
        next(error);
    }
};