-- ============================================================
-- Migration 0002: Fix RLS for server-side Drizzle connections
-- ============================================================
-- Drizzle connects to Postgres directly via DATABASE_URL, which
-- runs as the 'postgres' / 'service_role' role. This role does NOT
-- carry a Supabase JWT, so auth.uid() returns NULL and all RLS
-- INSERT/UPDATE/DELETE policies fail.
--
-- The fix: add explicit USING (true) / WITH CHECK (true) policies
-- for the 'service_role' role on every table. This is the official
-- Supabase pattern for server-side clients that already enforce
-- auth at the application layer (requireUserId, assertOwnership…).
--
-- Security is maintained because:
--   1. service_role key is only used server-side (never sent to browser)
--   2. Every mutation goes through requireUserId() + assertXOwnership()
--   3. Anon / authenticated RLS policies are NOT changed
-- ============================================================

-- exercises
DROP POLICY IF EXISTS service_role_exercises ON "public"."exercises";
CREATE POLICY service_role_exercises
  ON "public"."exercises"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- exercise_substitutions
DROP POLICY IF EXISTS service_role_exercise_substitutions ON "public"."exercise_substitutions";
CREATE POLICY service_role_exercise_substitutions
  ON "public"."exercise_substitutions"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- routines
DROP POLICY IF EXISTS service_role_routines ON "public"."routines";
CREATE POLICY service_role_routines
  ON "public"."routines"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- routine_days
DROP POLICY IF EXISTS service_role_routine_days ON "public"."routine_days";
CREATE POLICY service_role_routine_days
  ON "public"."routine_days"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- routine_exercises
DROP POLICY IF EXISTS service_role_routine_exercises ON "public"."routine_exercises";
CREATE POLICY service_role_routine_exercises
  ON "public"."routine_exercises"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- workout_sessions
DROP POLICY IF EXISTS service_role_workout_sessions ON "public"."workout_sessions";
CREATE POLICY service_role_workout_sessions
  ON "public"."workout_sessions"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- set_logs
DROP POLICY IF EXISTS service_role_set_logs ON "public"."set_logs";
CREATE POLICY service_role_set_logs
  ON "public"."set_logs"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- weekly_metrics
DROP POLICY IF EXISTS service_role_weekly_metrics ON "public"."weekly_metrics";
CREATE POLICY service_role_weekly_metrics
  ON "public"."weekly_metrics"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- user_profiles
DROP POLICY IF EXISTS service_role_user_profiles ON "public"."user_profiles";
CREATE POLICY service_role_user_profiles
  ON "public"."user_profiles"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- phase_history
DROP POLICY IF EXISTS service_role_phase_history ON "public"."phase_history";
CREATE POLICY service_role_phase_history
  ON "public"."phase_history"
  TO service_role
  USING (true)
  WITH CHECK (true);
