import {pgTable, timestamp, uuid, varchar} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    id : uuid().defaultRandom().primaryKey(),
    name : varchar({length : 100}).notNull(),
    email : varchar({length : 255}).notNull().unique(),
    password : varchar({length : 255}).notNull(),
    createdAt : timestamp().notNull().defaultNow()
})