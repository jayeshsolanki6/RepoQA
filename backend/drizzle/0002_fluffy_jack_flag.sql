CREATE TYPE "public"."repository_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"owner" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"githubUrl" varchar(255) NOT NULL,
	"status" "repository_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;