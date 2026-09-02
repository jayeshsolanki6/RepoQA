import { ApiError } from "../../utils/ApiError.js";
import { createRepository, deleteRepositoryById, getRepositoriesByUserId, getRepositoryById } from "./repository.repository.js";

import { indexingQueue } from "../../queue/indexing.queue.js";

import { simpleGit } from "simple-git";

const git = simpleGit();

const VERIFY_TIMEOUT_MS = 15_000;

/**
 * Preflight the GitHub URL before anything is persisted.
 *
 * `git ls-remote` performs a tiny network handshake (no clone) and fails
 * cleanly for repositories that do not exist, are private, or are otherwise
 * unreachable. Without this step, a well-formed URL pointing at a bogus repo
 * was written to the database immediately and only failed later inside the
 * background indexing worker, leaving a useless repository row behind.
 */
const verifyRepositoryExists = async (githubUrl: string): Promise<void> => {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
            () => reject(new ApiError(504, "Timed out verifying the GitHub repository.")),
            VERIFY_TIMEOUT_MS
        );
    });

    try {
        await Promise.race([
            git.listRemote([githubUrl]),
            timeout,
        ]);
    } catch (error) {
        // Re-throw the timeout as-is; convert any git failure to a 400.
        if (error instanceof ApiError) throw error;

        throw new ApiError(
            400,
            "GitHub repository not found or not accessible. Make sure it exists and is public."
        );
    } finally {
        clearTimeout(timer);
    }
};

export const repositoryService = {
    create: async (userId: string, githubUrl: string) => {
        const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;
        const match = githubUrl.match(regex);

        if (!match) {
            throw new ApiError(400, "Invalid GitHub repository URL");
        }

        const [, owner, name] = match;

        // Only create the database row once we know the repository exists.
        await verifyRepositoryExists(githubUrl);

        const repository = await createRepository(userId, owner, name, githubUrl);

        await indexingQueue.add(
            "index-repository",
            {
                repositoryId: repository.id,
                githubUrl: repository.githubUrl,
            }
        );

        return repository;
    },

    getAll: async (userId: string) => {
        return await getRepositoriesByUserId(userId);
    },

    getOne: async (userId: string, repositoryId: string) => {
        const repository = await getRepositoryById(repositoryId);

        if (!repository || repository.userId !== userId) {
            throw new ApiError(404, "Repository not found");
        }

        return repository;
    },

    remove: async (userId: string, repositoryId: string) => {
        const repository = await getRepositoryById(repositoryId);

        if (!repository || repository.userId !== userId) {
            throw new ApiError(404, "Repository not found");
        }

        await deleteRepositoryById(repositoryId);
    },
};