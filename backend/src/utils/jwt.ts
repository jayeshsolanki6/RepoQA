import jwt from 'jsonwebtoken'
import { ApiError } from './ApiError.js';

export const generateAccessToken = (userId : string) => {
    const token = jwt.sign(
        {userId},
        process.env.ACCESS_TOKEN_SECRET as string,
        {expiresIn: '15m'}
    )
    return token;
}

export const generateRefreshToken = (userId : string) => {
    const token = jwt.sign(
        {userId},
        process.env.REFRESH_TOKEN_SECRET as string,
        {expiresIn: '7d'}
    )
    return token;
}

export const verifyAccessToken = (token : string) => {
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
    } catch (error) {
        throw new ApiError(401, "Access token expired.");
    }
}

export const verifyRefreshToken = (token : string) => {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
    } catch (error) {
        throw new ApiError(401, "Refresh token expired.");
    }
}
