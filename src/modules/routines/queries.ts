import { eq, asc, inArray, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  exercises,
  routineDays,
  routineExercises,
  routines,
} from "@/drizzle/schema";

function routineSummarySelect() {
  return {
    id: routines.id,
    name: routines.name,
    description: routines.description,
    isArchived: routines.isArchived,
    createdAt: routines.createdAt,
  };
}

export async function getRoutinesForUser(userId: string) {
  return db
    .select(routineSummarySelect())
    .from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.isArchived, false)))
    .orderBy(asc(routines.createdAt));
}

export async function getArchivedRoutinesForUser(userId: string) {
  return db
    .select(routineSummarySelect())
    .from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.isArchived, true)))
    .orderBy(asc(routines.createdAt));
}

export type RoutineDayWithExercises = {
  id: string;
  routineId: string;
  dayOrder: number;
  dayLabel: string | null;
  splitType: string | null;
  isRestDay: boolean | null;
  daysOfWeek: string | null;
  exercises: {
    id: string;
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    orderInDay: number;
    targetSets: number;
    warmupSets: string | null;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    restTime: string | null;
    earlySetRpe: string | null;
    lastSetRpe: string | null;
    lastSetTechnique: string | null;
    notes: string | null;
  }[];
};

export async function getRoutineDaysWithExercises(
  routineId: string
): Promise<RoutineDayWithExercises[]> {
  const days = await db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routineId))
    .orderBy(asc(routineDays.dayOrder));

  if (days.length === 0) return [];

  const dayIds = days.map((d) => d.id);

  // Fetch exercises for all days in one query
  const exRows = await db
    .select({
      id: routineExercises.id,
      routineDayId: routineExercises.routineDayId,
      exerciseId: routineExercises.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
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
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(inArray(routineExercises.routineDayId, dayIds))
    .orderBy(asc(routineExercises.orderInDay));

  // Group exercises by day
  const exercisesByDay = new Map<string, typeof exRows>();
  for (const ex of exRows) {
    const list = exercisesByDay.get(ex.routineDayId) ?? [];
    list.push(ex);
    exercisesByDay.set(ex.routineDayId, list);
  }

  return days.map((day) => ({
    ...day,
    splitType: day.splitType as string | null,
    exercises: (exercisesByDay.get(day.id) ?? []).map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      orderInDay: ex.orderInDay,
      targetSets: ex.targetSets,
      warmupSets: ex.warmupSets,
      targetRepsMin: ex.targetRepsMin,
      targetRepsMax: ex.targetRepsMax,
      restTime: ex.restTime,
      earlySetRpe: ex.earlySetRpe,
      lastSetRpe: ex.lastSetRpe,
      lastSetTechnique: ex.lastSetTechnique,
      notes: ex.notes,
    })),
  }));
}

export async function getFullRoutineWithDays(routineId: string) {
  const routine = await db
    .select()
    .from(routines)
    .where(eq(routines.id, routineId))
    .limit(1);

  if (!routine[0]) return null;

  const days = await getRoutineDaysWithExercises(routineId);

  return {
    ...routine[0],
    days,
  };
}
