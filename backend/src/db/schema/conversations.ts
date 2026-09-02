import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { repositories } from "./repositories.js";

export const conversations = pgTable("conversations", {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull().references(
        () => users.id, 
        { onDelete: "cascade" }
    ),
    repositoryId: uuid().notNull().references(
        () => repositories.id, 
        { onDelete: "cascade" }
    ),
    createdAt: timestamp().defaultNow().notNull(),
});