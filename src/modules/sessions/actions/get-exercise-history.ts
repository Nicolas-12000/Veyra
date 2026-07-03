"use server";

import { requireUserId } from "@/src/modules/auth/server";
import { getLastSetsByExercise, getLastSetsByExerciseAnywhere } from "../queries";

export async function getExerciseHistoryAction(params: {
  exerciseId: string;
  routineDayId?: string | null;
}) {
  const userId = await requireUserId();

  if (params.routineDayId) {
    const sets = await getLastSetsByExercise({
      userId,
      exerciseId: params.exerciseId,
      routineDayId: params.routineDayId,
    });
    if (sets.length > 0) {
      return { sets, isFromSameDay: true } as const;
    }
  }

  const sets = await getLastSetsByExerciseAnywhere({
    userId,
    exerciseId: params.exerciseId,
  });

  return { sets, isFromSameDay: false } as const;
}
