CREATE TYPE "public"."source" AS ENUM('linkedin', 'company_website', 'other');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"role_title" text NOT NULL,
	"job_url" text,
	"status" "status" DEFAULT 'saved' NOT NULL,
	"date" timestamp NOT NULL,
	"source" "source" NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
DROP TABLE "verification" CASCADE;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;