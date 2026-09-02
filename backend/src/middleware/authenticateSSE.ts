import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken, verifyRefreshToken } from "../utils/jwt.js";
import { getRefreshTokenByUserId, getUserById } from "../modules/auth/auth.repository.js";
import { comparePassword } from "../utils/bcrypt.js";

export const authenticateSSE = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const refreshToken = req.cookies?.refreshToken;

        let userId: string | null = null;

        if (bearerToken) {
            const payload = verifyAccessToken(bearerToken) as { userId: string };
            userId = payload.userId;
        } else if (refreshToken) {
            const payload = verifyRefreshToken(refreshToken) as { userId: string };
            userId = payload.userId;

            const user = await getUserById(userId);

            if (!user) {
                throw new ApiError(401, "Unauthorized.");
            }

            const storedToken = await getRefreshTokenByUserId(userId);

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
        } else {
            throw new ApiError(401, "Unauthorized.");
        }

        const user = await getUserById(userId!);

        if (!user) {
            throw new ApiError(401, "Unauthorized.");
        }

        req.user = {
            userId: user.id,
        };

        next();
    } catch (error) {
        next(error);
    }
};