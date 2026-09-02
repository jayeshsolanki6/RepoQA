import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = ( error : Error, _req : Request, res : Response, _next : NextFunction) => {
    if(error instanceof ApiError){
        return res.status(error.statusCode).json({
            success : false,
            message : error.message,
        });
    }
    console.error(error);

    return res.status(500).json({
        success : false,
        message : error.message || "Internal Server Error",
    });
}