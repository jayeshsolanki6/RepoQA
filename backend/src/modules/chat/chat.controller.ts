import {
    NextFunction,
    Request,
    Response,
} from "express";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { chatService } from "./chat.service.js";
import { createConversation } from "./chat.repository.js";

export const ask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const repositoryId = req.params.repositoryId as string;

        const {
            conversationId,
            question,
        } = req.body;

        const result = await chatService.ask(
            req.user.userId,
            repositoryId,
            conversationId,
            question
        );

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

export const createChat = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const repositoryId = req.params.repositoryId as string;

        const conversation = await createConversation(
            req.user.userId,
            repositoryId
        );

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