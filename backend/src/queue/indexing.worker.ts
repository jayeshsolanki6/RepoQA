import { Worker } from "bullmq";

import { redisConnection } from "./connection.js";

import { cloneService } from "../modules/clone/clone.service.js";
import { indexingService } from "../modules/embed/indexing.service.js";
import { deleteClonedRepository } from "../modules/clone/git.js";

import {
    publishProgress,
} from "../modules/progress/progress.service.js";

export const indexingWorker = new Worker(
    "repository-indexing",

    async (job) => {
        const {
            repositoryId,
            githubUrl,
        } = job.data;

        console.log(
            `Starting indexing: ${repositoryId}`
        );

        let repoPath: string | undefined;

        try {
            await publishProgress(
                repositoryId,
                "cloning",
                "Cloning repository..."
            );

            console.log("Cloning repository...");

            repoPath = await cloneService.clone(
                repositoryId,
                githubUrl
            );

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

            console.log(
                `Indexing completed: ${repositoryId}`
            );

            return {
                success: true,
            };

        } catch (error) {
            await publishProgress(
                repositoryId,
                "failed",
                "Repository indexing failed"
            );

            console.error(
                `Indexing failed: ${repositoryId}`,
                error
            );

            throw error;

        } finally {
            if (repoPath) {
                await deleteClonedRepository(repoPath);
            }
        }
    },

    {
        connection: redisConnection,
    }
);

indexingWorker.on("completed", (job) => {
    console.log(
        `Job ${job.id} completed successfully`
    );
});

indexingWorker.on("failed", (job, error) => {
    console.error(
        `Job ${job?.id} failed:`,
        error.message
    );
});