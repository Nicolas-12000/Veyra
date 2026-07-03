-- Secure public tables with RLS and ownership policies

ALTER TABLE IF EXISTS "public"."exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."exercise_substitutions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."routine_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."routine_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."routines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."set_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."weekly_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."workout_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."phase_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DROP POLICY IF EXISTS exercises_read ON "public"."exercises";--> statement-breakpoint
DROP POLICY IF EXISTS exercises_write_custom ON "public"."exercises";--> statement-breakpoint
CREATE POLICY exercises_read ON "public"."exercises" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY exercises_write_custom ON "public"."exercises" FOR INSERT WITH CHECK (is_custom = true AND auth.role() = 'authenticated');--> statement-breakpoint

DROP POLICY IF EXISTS own_routines ON "public"."routines";--> statement-breakpoint
CREATE POLICY own_routines ON "public"."routines" FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS own_workout_sessions ON "public"."workout_sessions";--> statement-breakpoint
DROP POLICY IF EXISTS own_sessions ON "public"."workout_sessions";--> statement-breakpoint
CREATE POLICY own_sessions ON "public"."workout_sessions" FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS own_set_logs ON "public"."set_logs";--> statement-breakpoint
CREATE POLICY own_set_logs ON "public"."set_logs" FOR ALL USING (session_id IN (SELECT id FROM "public"."workout_sessions" WHERE user_id = auth.uid())) WITH CHECK (session_id IN (SELECT id FROM "public"."workout_sessions" WHERE user_id = auth.uid()));--> statement-breakpoint

DROP POLICY IF EXISTS own_metrics ON "public"."weekly_metrics";--> statement-breakpoint
CREATE POLICY own_metrics ON "public"."weekly_metrics" FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS own_phase_history ON "public"."phase_history";--> statement-breakpoint
CREATE POLICY own_phase_history ON "public"."phase_history" FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS own_user_profiles ON "public"."user_profiles";--> statement-breakpoint
CREATE POLICY own_user_profiles ON "public"."user_profiles" FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS own_routine_days ON "public"."routine_days";--> statement-breakpoint
CREATE POLICY own_routine_days ON "public"."routine_days" FOR ALL USING (EXISTS (SELECT 1 FROM "public"."routines" WHERE routines.id = routine_days.routine_id AND routines.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM "public"."routines" WHERE routines.id = routine_days.routine_id AND routines.user_id = auth.uid()));--> statement-breakpoint

DROP POLICY IF EXISTS own_routine_exercises ON "public"."routine_exercises";--> statement-breakpoint
CREATE POLICY own_routine_exercises ON "public"."routine_exercises" FOR ALL USING (EXISTS (SELECT 1 FROM "public"."routine_days" JOIN "public"."routines" ON routines.id = routine_days.routine_id WHERE routine_days.id = routine_exercises.routine_day_id AND routines.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM "public"."routine_days" JOIN "public"."routines" ON routines.id = routine_days.routine_id WHERE routine_days.id = routine_exercises.routine_day_id AND routines.user_id = auth.uid()));--> statement-breakpoint

DROP POLICY IF EXISTS public_exercise_substitutions_read ON "public"."exercise_substitutions";--> statement-breakpoint
CREATE POLICY public_exercise_substitutions_read ON "public"."exercise_substitutions" FOR SELECT USING (true);--> statement-breakpoint