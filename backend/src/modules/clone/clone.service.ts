import path from "path";
import fs from "fs/promises";

import { cloneRepository } from "./git.js";

export const cloneService = {
  clone: async (repositoryId: string, githubUrl: string) => {

    const repoPath = path.join(process.cwd(), "repos", repositoryId);
    await fs.mkdir(path.dirname(repoPath), { recursive: true });
    await cloneRepository(githubUrl, repoPath);

    return repoPath;
  }
};