import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { getUserById } from "../modules/auth/auth.repository.js";


export const authenticate = async(req : Request, _res : Response, next : NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        const token = authHeader?.split(' ')[1];

        if(!token) throw new ApiError(401, "Unauthorize.");

        const payload = verifyAccessToken(token) as {userId : string};
        const userId = payload.userId;
        const user = await getUserById(userId);

        if(!user) throw new ApiError(401, "Unauthorize.");

        req.user = {
            userId : user.id
        }
        next();
    } catch (error) {
        next(error);
    }
}