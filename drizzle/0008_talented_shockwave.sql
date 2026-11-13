CREATE TYPE "public"."exercise_measure" AS ENUM('reps', 'seconds');--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "measure" "exercise_measure" DEFAULT 'reps' NOT NULL;