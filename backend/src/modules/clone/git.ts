import { simpleGit } from "simple-git";
import fs from "fs/promises";

const git = simpleGit();

export const cloneRepository = async (githubUrl: string, destination: string) => {
    await git.clone(githubUrl, destination);
};

export const deleteClonedRepository = async (repositoryPath: string) => {
    await fs.rm(repositoryPath, {
        recursive: true,
        force: true,
    });
};