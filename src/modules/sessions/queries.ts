import { and, eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { setLogs, workoutSessions } from "@/drizzle/schema";

export async function getLastSetsByExercise(params: {
  userId: string;
  exerciseId: string;
  routineDayId: string;
}) {
  // Find the most recent completed session that matches the routineDayId and has logs for this exercise
  const recentSession = await db
    .select({
      id: workoutSessions.id,
      sessionDate: workoutSessions.sessionDate,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        eq(workoutSessions.completed, true),
        eq(workoutSessions.routineDayId, params.routineDayId),
        eq(setLogs.exerciseId, params.exerciseId)
      )
    )
    .orderBy(desc(workoutSessions.sessionDate), desc(workoutSessions.createdAt))
    .limit(1);

  if (recentSession.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: setLogs.id,
      setNumber: setLogs.setNumber,
      reps: setLogs.reps,
      weightKg: setLogs.weightKg,
      rpe: setLogs.rpe,
      notes: setLogs.notes,
    })
    .from(setLogs)
    .where(
      and(
        eq(setLogs.sessionId, recentSession[0].id),
        eq(setLogs.exerciseId, params.exerciseId)
      )
    )
    .orderBy(asc(setLogs.setNumber));

  return rows.map((r) => ({
    id: r.id,
    setNumber: r.setNumber,
    reps: r.reps,
    weightKg: parseFloat(r.weightKg),
    rpe: r.rpe ? parseFloat(r.rpe) : null,
    notes: r.notes,
  }));
}

export async function getLastSetsByExerciseAnywhere(params: {
  userId: string;
  exerciseId: string;
}) {
  // Find the most recent completed session that has logs for this exercise, anywhere
  const recentSession = await db
    .select({
      id: workoutSessions.id,
      sessionDate: workoutSessions.sessionDate,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        eq(workoutSessions.completed, true),
        eq(setLogs.exerciseId, params.exerciseId)
      )
    )
    .orderBy(desc(workoutSessions.sessionDate), desc(workoutSessions.createdAt))
    .limit(1);

  if (recentSession.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: setLogs.id,
      setNumber: setLogs.setNumber,
      reps: setLogs.reps,
      weightKg: setLogs.weightKg,
      rpe: setLogs.rpe,
      notes: setLogs.notes,
    })
    .from(setLogs)
    .where(
      and(
        eq(setLogs.sessionId, recentSession[0].id),
        eq(setLogs.exerciseId, params.exerciseId)
      )
    )
    .orderBy(asc(setLogs.setNumber));

  return rows.map((r) => ({
    id: r.id,
    setNumber: r.setNumber,
    reps: r.reps,
    weightKg: parseFloat(r.weightKg),
    rpe: r.rpe ? parseFloat(r.rpe) : null,
    notes: r.notes,
  }));
}
