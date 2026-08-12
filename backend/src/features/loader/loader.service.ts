import path from "path";
import { readRepository } from "./fileReader.js";

export const loaderService = {
    load: async (repositoryId: string) => {
        const repositoryPath = path.join(
            process.cwd(),
            "repos",
            repositoryId
        );
        const files = await readRepository(repositoryPath);
        return files;
    },
};