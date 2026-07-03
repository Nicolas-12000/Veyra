import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { routineDays, routineExercises, routines, userProfiles } from "@/drizzle/schema";

export async function assertRoutineOwnership(routineId: string, userId: string) {
  const [row] = await db
    .select({ userId: routines.userId })
    .from(routines)
    .where(eq(routines.id, routineId));

  if (!row || row.userId !== userId) {
    throw new Error("Unauthorized");
  }
}

export async function createRoutine(params: {
  userId: string;
  name: string;
  description?: string;
}) {
  const [row] = await db
    .insert(routines)
    .values({
      userId: params.userId,
      name: params.name,
      description: params.description,
    })
    .returning({ id: routines.id });

  return row;
}

export async function updateRoutine(params: {
  userId: string;
  routineId: string;
  name?: string;
  description?: string | null;
}) {
  await assertRoutineOwnership(params.routineId, params.userId);

  await db
    .update(routines)
    .set({
      name: params.name,
      description: params.description ?? undefined,
    })
    .where(eq(routines.id, params.routineId));
}

export async function archiveRoutine(params: {
  userId: string;
  routineId: string;
}) {
  await assertRoutineOwnership(params.routineId, params.userId);

  await db
    .update(routines)
    .set({ isArchived: true })
    .where(eq(routines.id, params.routineId));
}

export async function addRoutineDay(params: {
  userId: string;
  routineId: string;
  dayOrder: number;
  dayLabel?: string;
  splitType?:
    | "push"
    | "pull"
    | "legs"
    | "upper"
    | "lower"
    | "full_body"
    | "rest";
  isRestDay?: boolean;
  daysOfWeek?: string;
}) {
  await assertRoutineOwnership(params.routineId, params.userId);

  const [row] = await db
    .insert(routineDays)
    .values({
      routineId: params.routineId,
      dayOrder: params.dayOrder,
      dayLabel: params.dayLabel,
      splitType: params.splitType,
      isRestDay: params.isRestDay ?? false,
      daysOfWeek: params.daysOfWeek,
    })
    .returning({ id: routineDays.id });

  return row;
}

async function getRoutineIdForDay(routineDayId: string) {
  const [row] = await db
    .select({ routineId: routineDays.routineId })
    .from(routineDays)
    .where(eq(routineDays.id, routineDayId));

  if (!row) {
    throw new Error("Routine day not found");
  }

  return row.routineId;
}

async function assertRoutineDayOwnership(routineDayId: string, userId: string) {
  const routineId = await getRoutineIdForDay(routineDayId);
  await assertRoutineOwnership(routineId, userId);
}

export async function removeRoutineDay(params: {
  userId: string;
  routineDayId: string;
}) {
  await assertRoutineDayOwnership(params.routineDayId, params.userId);

  await db.delete(routineDays).where(eq(routineDays.id, params.routineDayId));
}

export async function addRoutineExercise(params: {
  userId: string;
  routineDayId: string;
  exerciseId: string;
  orderInDay: number;
  targetSets?: number;
  warmupSets?: string;
  targetRepsMin?: number;
  targetRepsMax?: number;
  restTime?: string;
  earlySetRpe?: string;
  lastSetRpe?: string;
  lastSetTechnique?: string;
  notes?: string;
}) {
  await assertRoutineDayOwnership(params.routineDayId, params.userId);

  const [row] = await db
    .insert(routineExercises)
    .values({
      routineDayId: params.routineDayId,
      exerciseId: params.exerciseId,
      orderInDay: params.orderInDay,
      targetSets: params.targetSets ?? 3,
      warmupSets: params.warmupSets,
      targetRepsMin: params.targetRepsMin,
      targetRepsMax: params.targetRepsMax,
      restTime: params.restTime,
      earlySetRpe: params.earlySetRpe,
      lastSetRpe: params.lastSetRpe,
      lastSetTechnique: params.lastSetTechnique,
      notes: params.notes,
    })
    .returning({ id: routineExercises.id });

  return row;
}

async function assertRoutineExerciseOwnership(
  routineExerciseId: string,
  userId: string
) {
  const [row] = await db
    .select({ routineDayId: routineExercises.routineDayId })
    .from(routineExercises)
    .where(eq(routineExercises.id, routineExerciseId));

  if (!row) {
    throw new Error("Routine exercise not found");
  }

  await assertRoutineDayOwnership(row.routineDayId, userId);
}

export async function updateRoutineExercise(params: {
  userId: string;
  routineExerciseId: string;
  targetSets?: number;
  warmupSets?: string | null;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  restTime?: string | null;
  earlySetRpe?: string | null;
  lastSetRpe?: string | null;
  lastSetTechnique?: string | null;
  notes?: string | null;
}) {
  await assertRoutineExerciseOwnership(params.routineExerciseId, params.userId);

  await db
    .update(routineExercises)
    .set({
      targetSets: params.targetSets,
      warmupSets: params.warmupSets,
      targetRepsMin: params.targetRepsMin,
      targetRepsMax: params.targetRepsMax,
      restTime: params.restTime,
      earlySetRpe: params.earlySetRpe,
      lastSetRpe: params.lastSetRpe,
      lastSetTechnique: params.lastSetTechnique,
      notes: params.notes ?? undefined,
    })
    .where(eq(routineExercises.id, params.routineExerciseId));
}

export async function removeRoutineExercise(params: {
  userId: string;
  routineExerciseId: string;
}) {
  await assertRoutineExerciseOwnership(params.routineExerciseId, params.userId);

  await db
    .delete(routineExercises)
    .where(eq(routineExercises.id, params.routineExerciseId));
}

export async function reorderRoutineExercises(params: {
  userId: string;
  routineDayId: string;
  orderedIds: string[];
}) {
  await assertRoutineDayOwnership(params.routineDayId, params.userId);

  const existing = await db
    .select({ id: routineExercises.id })
    .from(routineExercises)
    .where(eq(routineExercises.routineDayId, params.routineDayId));

  const existingIds = new Set(existing.map((row) => row.id));
  const nextIds = params.orderedIds.filter((id) => existingIds.has(id));

  await db.transaction(async (tx) => {
    await Promise.all(
      nextIds.map((id, index) =>
        tx
          .update(routineExercises)
          .set({ orderInDay: index + 1 })
          .where(
            and(
              eq(routineExercises.id, id),
              eq(routineExercises.routineDayId, params.routineDayId)
            )
          )
      )
    );
  });
}

export async function setActiveRoutine(userId: string, routineId: string) {
  await db
    .insert(userProfiles)
    .values({ id: userId, activeRoutineId: routineId })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: { activeRoutineId: routineId },
    });
}

export async function cloneRoutine(params: { userId: string; sourceRoutineId: string }) {
  return db.transaction(async (tx) => {
    const [sourceRoutine] = await tx
      .select({ name: routines.name, description: routines.description })
      .from(routines)
      .where(eq(routines.id, params.sourceRoutineId));

    if (!sourceRoutine) {
      throw new Error("Routine not found");
    }

    const [newRoutine] = await tx
      .insert(routines)
      .values({
        userId: params.userId,
        name: `Copia de ${sourceRoutine.name}`,
        description: sourceRoutine.description,
      })
      .returning({ id: routines.id });

    const dayRows = await tx
      .select({
        id: routineDays.id,
        dayOrder: routineDays.dayOrder,
        dayLabel: routineDays.dayLabel,
        splitType: routineDays.splitType,
        isRestDay: routineDays.isRestDay,
        daysOfWeek: routineDays.daysOfWeek,
      })
      .from(routineDays)
      .where(eq(routineDays.routineId, params.sourceRoutineId))
      .orderBy(routineDays.dayOrder);

    const newDayRows = await tx
      .insert(routineDays)
      .values(
        dayRows.map((day) => ({
          routineId: newRoutine.id,
          dayOrder: day.dayOrder,
          dayLabel: day.dayLabel,
          splitType: day.splitType,
          isRestDay: day.isRestDay,
          daysOfWeek: day.daysOfWeek,
        }))
      )
      .returning({ id: routineDays.id });

    const dayMap = new Map<string, string>();
    dayRows.forEach((day, index) => {
      const created = newDayRows[index];
      if (created) {
        dayMap.set(day.id, created.id);
      }
    });

    if (dayRows.length > 0) {
      const exerciseRows = await tx
        .select({
          routineDayId: routineExercises.routineDayId,
          exerciseId: routineExercises.exerciseId,
          orderInDay: routineExercises.orderInDay,
          targetSets: routineExercises.targetSets,
          warmupSets: routineExercises.warmupSets,
          targetRepsMin: routineExercises.targetRepsMin,
          targetRepsMax: routineExercises.targetRepsMax,
          restTime: routineExercises.restTime,
          earlySetRpe: routineExercises.earlySetRpe,
          lastSetRpe: routineExercises.lastSetRpe,
          lastSetTechnique: routineExercises.lastSetTechnique,
          notes: routineExercises.notes,
        })
        .from(routineExercises)
        .where(inArray(routineExercises.routineDayId, dayRows.map((day) => day.id)));

      if (exerciseRows.length > 0) {
        await tx.insert(routineExercises).values(
          exerciseRows.map((exercise) => ({
            routineDayId: dayMap.get(exercise.routineDayId) ?? exercise.routineDayId,
            exerciseId: exercise.exerciseId,
            orderInDay: exercise.orderInDay,
            targetSets: exercise.targetSets,
            warmupSets: exercise.warmupSets,
            targetRepsMin: exercise.targetRepsMin,
            targetRepsMax: exercise.targetRepsMax,
            restTime: exercise.restTime,
            earlySetRpe: exercise.earlySetRpe,
            lastSetRpe: exercise.lastSetRpe,
            lastSetTechnique: exercise.lastSetTechnique,
            notes: exercise.notes,
          }))
        );
      }
    }

    return { routineId: newRoutine.id };
  });
}
