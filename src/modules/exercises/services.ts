import { and, eq, ilike, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { exerciseSubstitutions, exercises } from "@/drizzle/schema";

export async function createExercise(params: {
  name: string;
  muscleGroup:
    | "pecho"
    | "espalda"
    | "hombros"
    | "biceps"
    | "triceps"
    | "cuadriceps"
    | "isquios"
    | "gluteos"
    | "pantorrillas"
    | "core";
  movementPattern?:
    | "empuje_horizontal"
    | "empuje_vertical"
    | "jale_horizontal"
    | "jale_vertical"
    | "sentadilla"
    | "bisagra"
    | "aislamiento"
    | "core";
  mechanic?: "compound" | "isolation";
  isBilateral?: boolean;
  videoUrl?: string;
}) {
  const [row] = await db
    .insert(exercises)
    .values({
      name: params.name,
      muscleGroup: params.muscleGroup,
      movementPattern: params.movementPattern,
      mechanic: params.mechanic,
      isBilateral: params.isBilateral ?? true,
      videoUrl: params.videoUrl,
      isCustom: true,
    })
    .returning({ id: exercises.id });

  return row;
}

export async function listExercises(params?: {
  muscleGroup?: string;
  search?: string;
  includeCustom?: boolean;
}) {
  const conditions: SQL[] = [];

  if (params?.muscleGroup) {
    conditions.push(eq(exercises.muscleGroup, params.muscleGroup as any));
  }

  if (params?.search) {
    conditions.push(ilike(exercises.name, `%${params.search}%`));
  }

  if (params?.includeCustom === false) {
    conditions.push(eq(exercises.isCustom, false));
  }

  const query = db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      movementPattern: exercises.movementPattern,
      mechanic: exercises.mechanic,
      isBilateral: exercises.isBilateral,
      videoUrl: exercises.videoUrl,
      isCustom: exercises.isCustom,
    })
    .from(exercises);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  return await query;
}

export async function addSubstitution(params: {
  mainExerciseId: string;
  subExerciseId: string;
}) {
  await db.insert(exerciseSubstitutions).values({
    mainExerciseId: params.mainExerciseId,
    subExerciseId: params.subExerciseId,
  });
}

export async function removeSubstitution(params: {
  mainExerciseId: string;
  subExerciseId: string;
}) {
  await db
    .delete(exerciseSubstitutions)
    .where(
      and(
        eq(exerciseSubstitutions.mainExerciseId, params.mainExerciseId),
        eq(exerciseSubstitutions.subExerciseId, params.subExerciseId)
      )
    );
}
