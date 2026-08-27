CREATE TABLE "code_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repositoryId" uuid,
	"filePath" varchar(255) NOT NULL,
	"extension" varchar(20) NOT NULL,
	"startLine" integer NOT NULL,
	"endLine" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(3072) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_repositoryId_repositories_id_fk" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;