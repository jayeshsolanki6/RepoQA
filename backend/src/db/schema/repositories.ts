import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const repositoryStatusEnum = pgEnum("repository_status", [
    "pending", "ready", "failed",
]);

export const repositories = pgTable("repositories", {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    owner: varchar({ length: 100 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    githubUrl: varchar({ length: 255 }).notNull(),
    status: repositoryStatusEnum().default("pending").notNull(),
    createdAt: timestamp().notNull().defaultNow(),
});