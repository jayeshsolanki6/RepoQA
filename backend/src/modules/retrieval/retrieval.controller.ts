import { NextFunction, Request, Response } from "express";
import { retrievalService } from "./retrieval.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const search = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const repositoryId = req.params.repositoryId as string;
        const { question } = req.body;

        const chunks = await retrievalService.search(
            req.user.userId,
            repositoryId,
            question
        );

        res.status(200).json(
            new ApiResponse(
                "Relevant chunks retrieved successfully",
                chunks
            )
        );
    } catch (error) {
        next(error);
    }
};