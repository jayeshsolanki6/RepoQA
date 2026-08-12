import { pgTable, uuid, timestamp, varchar} from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const refreshTokens = pgTable("refresh_tokens", {
    id : uuid().primaryKey().defaultRandom(),
    userId : uuid().notNull().unique().references(
        () => users.id,
        {onDelete : "cascade" }
    ),
    hashedToken : varchar({length : 255}).unique().notNull(),
    expiresAt : timestamp().notNull(),
    createdAt : timestamp().notNull().defaultNow()
})
