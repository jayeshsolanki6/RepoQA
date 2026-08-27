import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversations.js";

export const messageRoleEnum = pgEnum("message_role", [
    "user",
    "assistant",
]);

export const messages = pgTable("messages", {
    id: uuid().defaultRandom().primaryKey(),

    conversationId: uuid()
        .notNull()
        .references(() => conversations.id, {
            onDelete: "cascade",
        }),

    role: messageRoleEnum().notNull(),

    content: text().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
});