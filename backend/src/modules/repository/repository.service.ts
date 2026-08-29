import { ApiError } from "../../utils/ApiError.js";
import { createRepository, deleteRepositoryById, getRepositoriesByUserId, getRepositoryById } from "./repository.repository.js";

import { indexingQueue } from "../../queue/indexing.queue.js";

export const repositoryService = {
    create: async (userId: string, githubUrl: string) => {
        const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;
        const match = githubUrl.match(regex);

        if (!match) {
            throw new ApiError(400, "Invalid GitHub repository URL");
        }

        const [, owner, name] = match;
        
        const repository =  await createRepository(userId, owner, name, githubUrl);
        
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