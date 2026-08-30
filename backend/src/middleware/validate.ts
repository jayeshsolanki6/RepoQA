import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

/**
 * Validates a part of the request against a Zod schema.
 *
 * NOTE: `ZodError` must be imported from "zod" (v4) — the same entrypoint the
 * schemas themselves are built with. Importing it from "zod/v3" yields a
 * different class, so `instanceof` silently fails and every validation error
 * escapes to the global error handler as a 500.
 */
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
