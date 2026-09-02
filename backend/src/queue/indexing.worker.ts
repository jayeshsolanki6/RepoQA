import { Worker } from "bullmq";

import { redisConnection } from "./connection.js";

import { cloneService } from "../modules/clone/clone.service.js";
import { indexingService } from "../modules/embed/indexing.service.js";
import { deleteClonedRepository } from "../modules/clone/git.js";

import { publishProgress } from "../modules/progress/progress.service.js";

export const indexingWorker = new Worker(
    "repository-indexing",

    async (job) => {
        const { repositoryId, githubUrl } = job.data;

        console.log(`Starting indexing: ${repositoryId}`);

        let repoPath: string | undefined;

        try {
            await publishProgress(repositoryId, "cloning", "Cloning repository...");

            console.log("Cloning repository...");

            repoPath = await cloneService.clone(repositoryId, githubUrl);

            await indexingService.index(
                repositoryId,
                async (step, message) => {
                    await publishProgress(
                        repositoryId,
                        step,
                        message
                    );
                }
            );

            await publishProgress(
                repositoryId,
                "completed",
                "Repository indexed successfully"
            );

            console.log(`Indexing completed: ${repositoryId}`);

            return {
                success: true,
            };

        } catch (error) {
            await publishProgress(
                repositoryId,
                "failed",
                "Repository indexing failed"
            );

            /* Drizzle wraps the real Postgres error in error.cause, while the
               top-level error.message is a multi-megabyte INSERT + params dump.
               Skip the giant top level when a cause exists and walk that
               chain; otherwise the message is already compact (e.g. ApiError
               thrown by saveChunks or the embedding service). */
            const hasCause = (error as { cause?: unknown })?.cause !== undefined;

            if (hasCause) {
                let depth = 0;
                let err: unknown = (error as { cause?: unknown })?.cause;
                while (err && depth < 4) {
                    const c = err as {
                        message?: string;
                        code?: string;
                        detail?: string;
                        cause?: unknown;
                    };
                    console.error(`Indexing failed: ${repositoryId} [cause ${depth}]`, c.message ?? err);
                    if (c.code) console.error("  code:", c.code);
                    if (c.detail) {
                        console.error("  detail:", String(c.detail).slice(0, 400));
                    }
                    err = c.cause;
                    depth++;
                }
            } else {
                console.error(
                    `Indexing failed: ${repositoryId}`,
                    error instanceof Error ? error.message : error
                );
            }

            throw error;

        } finally {
            if (repoPath) {
                await deleteClonedRepository(repoPath);
            }
        }
    },

    { connection: redisConnection }
);

indexingWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

indexingWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});