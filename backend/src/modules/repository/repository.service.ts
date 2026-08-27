import { ApiError } from "../../utils/ApiError.js";
import { createRepository, deleteRepositoryById, getRepositoriesByUserId, getRepositoryById } from "./repository.repository.js";
import { cloneService } from '../clone/clone.service.js'
import { loaderService } from "../loader/loader.service.js";
import { indexingService } from "../indexing/indexing.service.js";
import { deleteClonedRepository } from "../clone/git.js";

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

        // let repoPath: string | undefined;

        // try {
        //     repoPath = await cloneService.clone(repository.id, githubUrl);
        //     await indexingService.index(repository.id);
        //     return repository;
        // } catch (error) {
        //     await deleteRepositoryById(repository.id);
        //     throw error;
        // } finally {
        //     if (repoPath) {
        //         await deleteClonedRepository(repoPath);
        //     }
        // }
        
        // const files = await loaderService.load(repository.id);

        // console.log("----------------");
        // console.log(files[0].content);
        // console.log("----------------");
        
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