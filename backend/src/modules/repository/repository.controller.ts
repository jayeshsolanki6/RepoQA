import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { repositoryService } from "./repository.service.js";

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repository = await repositoryService.create(req.user.userId, req.body.githubUrl);

        res.status(201).json(
            new ApiResponse(
                "Repository added successfully", 
                repository
            )
        );
    } catch (error) {
        next(error);
    }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repositories = await repositoryService.getAll(req.user.userId);

        res.status(200).json(
            new ApiResponse(
                "Repositories fetched successfully", 
                repositories
            )
        );
    } catch (error) {
        next(error);
    }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repository = await repositoryService.getOne(req.user.userId, req.params.id as string);

        res.status(200).json(
            new ApiResponse(
                "Repository fetched successfully", 
                repository
            )
        );
    } catch (error) {
        next(error);
    }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await repositoryService.remove(req.user.userId, req.params.id as string);

        res.status(200).json(
            new ApiResponse("Repository deleted successfully")
        );
    } catch (error) {
        next(error);
    }
};