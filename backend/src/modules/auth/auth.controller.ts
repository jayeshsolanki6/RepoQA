import type { NextFunction, Request, Response } from 'express'

import { auth } from './auth.service.js'
import { ApiResponse } from '../../utils/ApiResponse.js';


export const register = async (req : Request, res : Response, next : NextFunction) => {
    try {
        const result = await auth.register(req.body);
 
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : 7*24*60*60*1000,
        })

        res.status(201).json(
            new ApiResponse(
                "User registered successfully",
                {
                    user: {
                        id: result.newUser.id,
                        name: result.newUser.name,
                        email: result.newUser.email
                    },
                    accessToken: result.accessToken,
                }
            )
        )

    } catch (error) {
         next(error);
    }
}


export const login = async (req : Request, res : Response, next : NextFunction) => {
    try {
        const result = await auth.login(req.body);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : 7*24*60*60*1000,
        })

        res.status(200).json(
            new ApiResponse(
                "User logged in successfully",
                {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email
                    },
                    accessToken: result.accessToken,
                }
            )
        )

    } catch (error) {
        next(error);
    }
}


export const refresh = async (req : Request, res : Response, next : NextFunction) => {
    try {
        const token = req.cookies.refreshToken;

        const result = await auth.refresh(token);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : 7*24*60*60*1000, 
        })
        
        res.status(200).json(
            new ApiResponse(
                "Token refreshed successfully",
                {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email
                    },
                    accessToken : result.accessToken
                }
            )
        )

    } catch (error) {
        next(error);
    }
}

export const logout = async (req : Request, res : Response, next : NextFunction) => {
    try {
        const userId = req.user.userId;

        await auth.logout(userId);

        res.clearCookie("refreshToken", {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "strict"
        });
        
        res.status(200).json(
            new ApiResponse("Logout Successful.")
        )
    } catch (error) {
        next(error);
    }
}