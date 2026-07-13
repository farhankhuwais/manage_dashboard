CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"amount" integer NOT NULL,
	"category" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_dues" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"week_number" integer NOT NULL,
	"year" integer NOT NULL,
	"amount" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_dues" ADD CONSTRAINT "weekly_dues_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;