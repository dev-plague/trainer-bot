CREATE TYPE "public"."plan_goal" AS ENUM('general_health', 'fat_loss', 'strength', 'endurance');--> statement-breakpoint
CREATE TYPE "public"."plan_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."plan_mode" AS ENUM('strict', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."plan_place" AS ENUM('home', 'gym', 'outdoor');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "plan_status" DEFAULT 'active' NOT NULL,
	"goal" "plan_goal" NOT NULL,
	"experience_level" "plan_level" NOT NULL,
	"days_per_week" integer NOT NULL,
	"session_minutes" integer NOT NULL,
	"place" "plan_place" NOT NULL,
	"equipment" text[] NOT NULL,
	"limitations" text DEFAULT '' NOT NULL,
	"mode" "plan_mode" NOT NULL,
	"inputs_snapshot" jsonb NOT NULL,
	"engine_version" text NOT NULL,
	"warnings" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_day" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"day_index" integer NOT NULL,
	"category" text NOT NULL,
	"is_rest" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_exercise" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_day_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"position" integer NOT NULL,
	"prescription" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_day" ADD CONSTRAINT "plan_day_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_exercise" ADD CONSTRAINT "plan_exercise_plan_day_id_plan_day_id_fk" FOREIGN KEY ("plan_day_id") REFERENCES "public"."plan_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_exercise" ADD CONSTRAINT "plan_exercise_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_user_id_idx" ON "plan" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_one_active_per_user_idx" ON "plan" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "plan_day_plan_index_idx" ON "plan_day" USING btree ("plan_id","day_index");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_exercise_day_position_idx" ON "plan_exercise" USING btree ("plan_day_id","position");--> statement-breakpoint
CREATE INDEX "plan_exercise_exercise_id_idx" ON "plan_exercise" USING btree ("exercise_id");