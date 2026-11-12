CREATE TYPE "public"."exercise_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."exercise_place" AS ENUM('home', 'gym', 'outdoor');--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"primary_muscles" text[] NOT NULL,
	"secondary_muscles" text[] DEFAULT '{}' NOT NULL,
	"equipment" text[] DEFAULT '{}' NOT NULL,
	"place" "exercise_place" NOT NULL,
	"level" "exercise_level" NOT NULL,
	"tips" text[] NOT NULL,
	"contraindications" text[] DEFAULT '{}' NOT NULL,
	"equivalence_group" text NOT NULL,
	"regression_id" text,
	"is_complex" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_regression_id_exercise_id_fk" FOREIGN KEY ("regression_id") REFERENCES "public"."exercise"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_equivalence_group_idx" ON "exercise" USING btree ("equivalence_group");