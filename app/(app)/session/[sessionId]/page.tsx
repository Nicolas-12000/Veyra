import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { workoutSessions, setLogs } from "@/drizzle/schema";
import { requireUserId } from "@/src/modules/auth/server";
import { getFullRoutineWithDays } from "@/src/modules/routines/queries";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { listExercises } from "@/src/modules/exercises/services";
import { ActiveSessionContainer } from "@/src/modules/sessions/components/ActiveSessionContainer";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const userId = await requireUserId();
  const { sessionId } = await params;

  // Verify session belongs to user & fetch user profile
  const [session, profile, allExercises] = await Promise.all([
    db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId))
      .then((rows) => rows[0]),
    getUserProfile(userId),
    listExercises(),
  ]);

  if (!session || session.userId !== userId) {
    notFound();
  }

  if (session.completed) {
    const { getSessionSummaryData } = await import("@/src/modules/analytics/queries");
    const { SessionSummary } = await import("@/src/modules/sessions/components/SessionSummary");

    const summary = await getSessionSummaryData({ sessionId, userId });
    
    // Calculate duration in minutes (createdAt -> complete/now)
    let duration = 45; // default fallback
    if (summary) {
      const start = new Date(summary.createdAt);
      const end = new Date(); // Or last set timestamp if available, but now is a solid fallback
      const diffMs = end.getTime() - start.getTime();
      duration = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    if (summary) {
      return (
        <SessionSummary
          summary={summary}
          unit={profile?.unitPref === "lb" ? "lb" : "kg"}
          durationMinutes={duration}
        />
      );
    }
  }

  // Get routine exercises if linked to a routine
  let routineData = null;
  let activeDay = null;

  if (session.routineId && session.routineDayId) {
    routineData = await getFullRoutineWithDays(session.routineId);
    activeDay = routineData?.days.find((d) => d.id === session.routineDayId);
  }

  // Fetch logged sets for this session to persist on reload
  const existingSets = await db
    .select()
    .from(setLogs)
    .where(eq(setLogs.sessionId, sessionId))
    .orderBy(asc(setLogs.setNumber));

  const mappedExistingSets = existingSets.map((s) => ({
    id: s.id,
    setNumber: s.setNumber,
    reps: s.reps,
    weightKg: Number(s.weightKg),
    rpe: s.rpe ? Number(s.rpe) : null,
    notes: s.notes,
    exerciseId: s.exerciseId,
  }));

  const exercises = activeDay?.exercises.map((e) => ({
    id: e.id,
    exerciseId: e.exerciseId,
    exerciseName: e.exerciseName,
    targetSets: e.targetSets,
    targetRepsMin: e.targetRepsMin,
    targetRepsMax: e.targetRepsMax,
    restTime: e.restTime,
    earlySetRpe: e.earlySetRpe,
    lastSetRpe: e.lastSetRpe,
    notes: e.notes,
  })) ?? [];

  return (
    <ActiveSessionContainer
      sessionId={sessionId}
      initialUnit={profile?.unitPref === "lb" ? "lb" : "kg"}
      routineDayId={session.routineDayId}
      routineName={routineData?.name ?? null}
      dayLabel={activeDay?.dayLabel ?? null}
      dayOrder={activeDay?.dayOrder ?? null}
      exercises={exercises}
      mappedExistingSets={mappedExistingSets}
      allExercises={allExercises}
    />
  );
}
