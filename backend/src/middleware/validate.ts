import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

export const validate = (schema: ZodType, source: 'body' | 'cookies' | 'headers') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedData = schema.parse(req[source]);
            if (source !== "headers") {
                req[source] = parsedData;
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const issues = error.issues.map((issue) => ({
                    field: issue.path.join(".") || source,
                    message: issue.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: issues[0]?.message ?? "Invalid request",
                    errors: issues,
                });
            }
            next(error);
        }
    }
}
