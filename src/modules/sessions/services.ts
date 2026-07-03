import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { setLogs, workoutSessions } from "@/drizzle/schema";

export async function deleteWorkoutSession(sessionId: string, userId: string) {
  await assertSessionOwnership(sessionId, userId);
  await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));
}

export async function deleteSet(setId: string, sessionId: string) {
  await db
    .delete(setLogs)
    .where(and(eq(setLogs.id, setId), eq(setLogs.sessionId, sessionId)));
}

export type StartSessionInput = {
  userId: string;
  routineId?: string;
  routineDayId?: string;
  sessionDate?: Date;
  notes?: string;
  sessionConfig?: Record<string, unknown>;
};

export async function createSession(input: StartSessionInput) {
  const [row] = await db
    .insert(workoutSessions)
    .values({
      userId: input.userId,
      routineId: input.routineId,
      routineDayId: input.routineDayId,
      sessionDate: (input.sessionDate ?? new Date()).toISOString().split("T")[0],
      notes: input.notes,
      sessionConfig: input.sessionConfig ?? {},
    })
    .returning({ id: workoutSessions.id });

  return row;
}

export async function assertSessionOwnership(sessionId: string, userId: string) {
  const [row] = await db
    .select({ userId: workoutSessions.userId })
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));

  if (!row || row.userId !== userId) {
    throw new Error("Unauthorized");
  }
}

export type LogSetInput = {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  isLastSet?: boolean;
  notes?: string;
};

export async function insertSet(input: LogSetInput) {
  await db.insert(setLogs).values({
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setNumber: input.setNumber,
    reps: input.reps,
    weightKg: String(input.weightKg),
    rpe: input.rpe !== undefined ? String(input.rpe) : undefined,
    isLastSet: input.isLastSet ?? false,
    notes: input.notes,
  });
}

export async function markSessionComplete(sessionId: string, userId: string) {
  await assertSessionOwnership(sessionId, userId);

  await db
    .update(workoutSessions)
    .set({ completed: true })
    .where(eq(workoutSessions.id, sessionId));
}

export async function applySessionOverride(params: {
  sessionId: string;
  routineExerciseId: string;
  overrides: Record<string, unknown>;
}) {
  const [row] = await db
    .select({ sessionConfig: workoutSessions.sessionConfig })
    .from(workoutSessions)
    .where(eq(workoutSessions.id, params.sessionId));

  if (!row) {
    throw new Error("Session not found");
  }

  const currentConfig =
    (row.sessionConfig as Record<string, unknown>) ?? {};
  const existingOverrides =
    (currentConfig.overrides as Record<string, Record<string, unknown>>) ?? {};
  const previousForExercise = existingOverrides[params.routineExerciseId] ?? {};

  const nextConfig = {
    ...currentConfig,
    overrides: {
      ...existingOverrides,
      [params.routineExerciseId]: {
        ...previousForExercise,
        ...params.overrides,
      },
    },
  };

  await db
    .update(workoutSessions)
    .set({ sessionConfig: nextConfig })
    .where(eq(workoutSessions.id, params.sessionId));
}
