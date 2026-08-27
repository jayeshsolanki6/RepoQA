import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { conversations, messages } from "../../db/schema/index.js";

export const createConversation = async (
    userId: string,
    repositoryId: string
) => {
    const result = await db
        .insert(conversations)
        .values({
            userId,
            repositoryId,
        })
        .returning();

    return result[0];
};

export const getConversation = async (
    conversationId: string
) => {
    const result = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId));

    return result[0];
};

export const saveMessage = async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
) => {
    const result = await db
        .insert(messages)
        .values({
            conversationId,
            role,
            content,
        })
        .returning();

    return result[0];
};


export const getRecentMessages = async (
    conversationId: string,
    limit = 10
) => {
    const result = await db
        .select({
            role: messages.role,
            content: messages.content,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(limit);

    return result.reverse();
};