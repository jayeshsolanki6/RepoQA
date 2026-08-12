import { ApiError } from "../../utils/ApiError.js";
import { createRepository, deleteRepositoryById, getRepositoriesByUserId, getRepositoryById } from "./repository.repository.js";
import { ingestionService } from '../../features/ingestion/ingestion.service.js'
import { loaderService } from "../../features/loader/loader.service.js";

export const repositoryService = {
    create: async (userId: string, githubUrl: string) => {
        const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;
        const match = githubUrl.match(regex);

        if (!match) {
            throw new ApiError(400, "Invalid GitHub repository URL");
        }

        const [, owner, name] = match;
        
        const repository =  await createRepository(userId, owner, name, githubUrl);
        
        try {
            await ingestionService.ingest(repository.id, githubUrl);
            
        } catch (error) {
            await deleteRepositoryById(repository.id);
            throw error;
        }
        
        const files = await loaderService.load(repository.id);
        
        console.log("----------------");
        console.log(files[0].content);
        console.log("----------------");
        
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