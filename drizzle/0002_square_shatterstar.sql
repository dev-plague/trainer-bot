CREATE TYPE "public"."address_form" AS ENUM('neutral', 'feminine', 'masculine');--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"preferred_name" text NOT NULL,
	"address_form" "address_form" DEFAULT 'neutral' NOT NULL,
	"birth_date" date,
	"height_cm" integer,
	"weight_kg" numeric(5, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;