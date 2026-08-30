ALTER TABLE "code_chunks" ALTER COLUMN "filePath" SET DATA TYPE text;--> statement-breakpoint
CREATE INDEX "code_chunks_repository_id_idx" ON "code_chunks" USING btree ("repositoryId");--> statement-breakpoint
CREATE INDEX "code_chunks_embedding_idx" ON "code_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "conversations_repository_id_idx" ON "conversations" USING btree ("repositoryId");--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_user_id_github_url_idx" ON "repositories" USING btree ("userId","githubUrl");--> statement-breakpoint
CREATE INDEX "repositories_user_id_created_at_idx" ON "repositories" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages" USING btree ("conversationId","createdAt");