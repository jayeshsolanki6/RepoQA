import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (
    error : Error,
    req : Request,
    res : Response,
    next : NextFunction
) => {
    if(error instanceof ApiError){
        return res.status(error.statusCode).json({
            success : false,
            message : error.message,
        });
    }
    console.log(error);
 
    return res.status(500).json({
        success : false,
        message : error.message as string | "Internal Server Error",
    });
}