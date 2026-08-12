import { simpleGit } from "simple-git";

const git = simpleGit();

export const cloneRepository = async (githubUrl: string, destination: string) => {
  await git.clone(githubUrl, destination);
};