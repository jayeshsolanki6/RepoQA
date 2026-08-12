import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { repositories } from "../../db/schema/index.js";

export const createRepository = async (
    userId: string,
    owner: string,
    name: string,
    githubUrl: string
) => {

    const result = await db
        .insert(repositories)
        .values({
            userId,
            owner,
            name,
            githubUrl
        })
        .returning();

    return result[0];
};

export const getRepositoriesByUserId = async (userId: string) => {
    return await db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, userId));
};

export const getRepositoryById = async (id: string) => {
    const result = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, id));

    return result[0];
};

export const deleteRepositoryById = async (id: string) => {
    await db
        .delete(repositories)
        .where(eq(repositories.id, id));
};