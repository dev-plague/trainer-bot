CREATE TYPE "public"."exercise_log_status" AS ENUM('pending', 'done', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."workout_session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "exercise_log" (
	"id" text PRIMARY KEY NOT NULL,
	"workout_session_id" text NOT NULL,
	"plan_exercise_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"position" integer NOT NULL,
	"status" "exercise_log_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "workout_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_day_id" text NOT NULL,
	"status" "workout_session_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "exercise_log" ADD CONSTRAINT "exercise_log_workout_session_id_workout_session_id_fk" FOREIGN KEY ("workout_session_id") REFERENCES "public"."workout_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_log" ADD CONSTRAINT "exercise_log_plan_exercise_id_plan_exercise_id_fk" FOREIGN KEY ("plan_exercise_id") REFERENCES "public"."plan_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_log" ADD CONSTRAINT "exercise_log_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_plan_day_id_plan_day_id_fk" FOREIGN KEY ("plan_day_id") REFERENCES "public"."plan_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_log_session_position_idx" ON "exercise_log" USING btree ("workout_session_id","position");--> statement-breakpoint
CREATE INDEX "workout_session_user_status_idx" ON "workout_session" USING btree ("user_id","status");