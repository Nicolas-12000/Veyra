CREATE TYPE "public"."mechanic" AS ENUM('compound', 'isolation');--> statement-breakpoint
CREATE TYPE "public"."movement_pattern" AS ENUM('empuje_horizontal', 'empuje_vertical', 'jale_horizontal', 'jale_vertical', 'sentadilla', 'bisagra', 'aislamiento', 'core');--> statement-breakpoint
CREATE TYPE "public"."muscle_group" AS ENUM('pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'cuadriceps', 'isquios', 'gluteos', 'pantorrillas', 'core');--> statement-breakpoint
CREATE TYPE "public"."phase" AS ENUM('volumen', 'definicion', 'recomposicion');--> statement-breakpoint
CREATE TYPE "public"."split_type" AS ENUM('push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'rest');--> statement-breakpoint
CREATE TYPE "public"."unit_pref" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_substitutions" (
	"main_exercise_id" uuid NOT NULL,
	"sub_exercise_id" uuid NOT NULL,
	CONSTRAINT "exercise_substitutions_main_exercise_id_sub_exercise_id_pk" PRIMARY KEY("main_exercise_id","sub_exercise_id")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"muscle_group" "muscle_group" NOT NULL,
	"movement_pattern" "movement_pattern",
	"mechanic" "mechanic",
	"is_bilateral" boolean DEFAULT true,
	"video_url" text,
	"is_custom" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "phase_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phase" "phase" NOT NULL,
	"start_date" date NOT NULL,
	"starting_weight_kg" numeric(5, 2),
	"target_weekly_change_kg" numeric(4, 3),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "routine_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"day_order" integer NOT NULL,
	"day_label" text,
	"split_type" "split_type",
	"is_rest_day" boolean DEFAULT false,
	"days_of_week" text
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_in_day" integer NOT NULL,
	"target_sets" integer DEFAULT 3 NOT NULL,
	"target_reps_min" integer,
	"target_reps_max" integer,
	"rest_time" text,
	"early_set_rpe" numeric(3, 1),
	"last_set_rpe" numeric(3, 1),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight_kg" numeric(6, 3) NOT NULL,
	"rpe" numeric(3, 1),
	"is_last_set" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"unit_pref" "unit_pref" DEFAULT 'kg',
	"current_phase" "phase" DEFAULT 'volumen',
	"starting_weight_kg" numeric(5, 2),
	"target_weekly_change_kg" numeric(4, 3),
	"phase_start_date" date,
	"active_routine_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"recorded_date" date NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"routine_id" uuid,
	"routine_day_id" uuid,
	"session_date" date NOT NULL,
	"notes" text,
	"completed" boolean DEFAULT false,
	"session_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "exercise_substitutions" ADD CONSTRAINT "exercise_substitutions_main_exercise_id_exercises_id_fk" FOREIGN KEY ("main_exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_substitutions" ADD CONSTRAINT "exercise_substitutions_sub_exercise_id_exercises_id_fk" FOREIGN KEY ("sub_exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_history" ADD CONSTRAINT "phase_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_days" ADD CONSTRAINT "routine_days_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_day_id_routine_days_id_fk" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_active_routine_id_routines_id_fk" FOREIGN KEY ("active_routine_id") REFERENCES "public"."routines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_metrics" ADD CONSTRAINT "weekly_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_day_id_routine_days_id_fk" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_metrics_user_date" ON "weekly_metrics" USING btree ("user_id","recorded_date");

-- Indexes for performance & analytics
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions (user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise_session ON set_logs (exercise_id, session_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_weight ON set_logs (weight_kg);
CREATE INDEX IF NOT EXISTS idx_weekly_metrics_user_date ON weekly_metrics (user_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_phase_history_user_date ON phase_history (user_id, start_date DESC);

-- Materialized View for Weekly Exercise Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS exercise_weekly_agg AS
SELECT
  ws.user_id::uuid                     AS user_id,
  date_trunc('week', ws.session_date) AS week,
  sl.exercise_id::uuid                 AS exercise_id,
  MAX(sl.weight_kg * (1 + sl.reps / 30.0)) AS estimated_1rm,
  MAX(sl.weight_kg)                   AS max_weight,
  SUM(sl.reps * sl.weight_kg)         AS volume,
  (SELECT reps FROM set_logs sl2
     WHERE sl2.session_id = sl.session_id
       AND sl2.exercise_id = sl.exercise_id
     ORDER BY (sl2.weight_kg * (1 + sl2.reps / 30.0)) DESC
     LIMIT 1) AS reps_of_best_set
FROM set_logs sl
JOIN workout_sessions ws ON sl.session_id = ws.id
GROUP BY ws.user_id, week, sl.exercise_id;

CREATE INDEX IF NOT EXISTS idx_exercise_weekly_agg_user_week ON exercise_weekly_agg (user_id, week);

CREATE OR REPLACE FUNCTION refresh_exercise_weekly_agg()
RETURNS void LANGUAGE sql AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_weekly_agg;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS phase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercises ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY own_sessions ON workout_sessions
  USING (user_id = auth.uid());

CREATE POLICY own_set_logs ON set_logs
  USING (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY own_metrics ON weekly_metrics
  USING (user_id = auth.uid());

CREATE POLICY own_routines ON routines
  USING (user_id = auth.uid());

CREATE POLICY own_phase_history ON phase_history
  USING (user_id = auth.uid());

CREATE POLICY exercises_read ON exercises
  FOR SELECT USING (true);

CREATE POLICY exercises_write_custom ON exercises
  FOR INSERT WITH CHECK (is_custom = true);