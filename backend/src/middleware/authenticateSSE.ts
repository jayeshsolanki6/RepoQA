import { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { verifyRefreshToken } from "../utils/jwt.js";

import { getRefreshTokenByUserId, getUserById } from "../modules/auth/auth.repository.js";

import { comparePassword } from "../utils/bcrypt.js";

export const authenticateSSE = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new ApiError(401, "Unauthorized.");
        }

        const payload = verifyRefreshToken(refreshToken) as { userId: string };

        const userId = payload.userId;

        const user = await getUserById(userId);

        if (!user) {
            throw new ApiError(401, "Unauthorized.");
        }

        const storedToken =
            await getRefreshTokenByUserId(userId);

        if (!storedToken) {
            throw new ApiError(401, "Unauthorized.");
        }

        const isValid = await comparePassword(refreshToken, storedToken.hashedToken);

        if (!isValid) {
            throw new ApiError(401, "Unauthorized.");
        }

        if (storedToken.expiresAt < new Date()) {
            throw new ApiError(401, "Refresh token expired.");
        }

        req.user = {
            userId: user.id,
        };

        next();

    } catch (error) {
        next(error);
    }
};