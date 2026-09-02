import { pgTable, uuid, varchar, integer, text, vector } from "drizzle-orm/pg-core";
import { repositories } from "./repositories.js";

export const codeChunks = pgTable("code_chunks", {
    id: uuid().notNull().defaultRandom().primaryKey(),
    repositoryId: uuid().notNull().references(
        () => repositories.id,
        { onDelete: "cascade" }
    ),
    filePath: text().notNull(),
    extension: varchar({ length: 20 }).notNull(),
    startLine: integer().notNull(),
    endLine: integer().notNull(),
    content: text().notNull(),
    embedding: vector("embedding", {
        dimensions: 3072,
    }).notNull(),
});
