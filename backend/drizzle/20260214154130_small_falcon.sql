CREATE TABLE "exercise_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_name" text NOT NULL,
	"sets_completed" integer NOT NULL,
	"reps_completed" text NOT NULL,
	"weight_used" text NOT NULL,
	"rpe" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"trainer_id" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer NOT NULL,
	"carbohydrates" integer NOT NULL,
	"fats" integer NOT NULL,
	"meal_suggestions" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"trainer_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"sleep_hours" numeric(3, 1) NOT NULL,
	"stress_level" text NOT NULL,
	"muscle_soreness" text NOT NULL,
	"energy_level" text NOT NULL,
	"score" integer NOT NULL,
	"recommendation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"trainer_id" text NOT NULL,
	"session_date" timestamp with time zone NOT NULL,
	"week_number" integer NOT NULL,
	"day_name" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_program_id_workout_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE cascade ON UPDATE no action;