ALTER TABLE "code_chunks" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "repositories" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."repository_status";