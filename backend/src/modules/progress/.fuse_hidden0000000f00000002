import {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getProgressHistory,
    subscribeToProgress,
    ProgressEvent,
} from "./progress.service.js";

import { getRepositoryById } from "../repository/repository.repository.js";

export const streamProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const repositoryId = req.params.repositoryId as string;

        const repository =
            await getRepositoryById(repositoryId);

        if (
            !repository ||
            repository.userId !== req.user.userId
        ) {
            res.status(404).end();
            return;
        }

        res.setHeader(
            "Content-Type",
            "text/event-stream"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache"
        );

        res.setHeader(
            "Connection",
            "keep-alive"
        );

        res.flushHeaders();

        const sendEvent = (
            event: ProgressEvent
        ) => {
            res.write(
                `event: ${event.step}\n`
            );

            res.write(
                `data: ${JSON.stringify(event)}\n\n`
            );
        };

        /*
         * IMPORTANT:
         * Subscribe FIRST.
         *
         * This prevents us from missing an event while
         * reading the previously stored events.
         */
        let lastSentId = 0;

        const subscription =
            await subscribeToProgress(
                repositoryId,
                (event) => {
                    if (event.id <= lastSentId) {
                        return;
                    }

                    lastSentId = event.id;

                    sendEvent(event);

                    if (
                        event.step === "completed" ||
                        event.step === "failed"
                    ) {
                        res.end();
                    }
                }
            );

        /*
         * Now read all events that happened before
         * the SSE connection was established.
         */
        const history =
            await getProgressHistory(repositoryId);

        for (const event of history) {
            if (event.id <= lastSentId) {
                continue;
            }

            lastSentId = event.id;

            sendEvent(event);

            if (
                event.step === "completed" ||
                event.step === "failed"
            ) {
                await subscription.close();
                res.end();
                return;
            }
        }

        req.on("close", async () => {
            await subscription.close();
        });

    } catch (error) {
        next(error);
    }
};