"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { removeRoutineExerciseSchema } from "@/src/modules/routines/schemas";
import { removeRoutineExercise } from "@/src/modules/routines/services";

export async function removeRoutineExerciseAction(payload: unknown) {
  const parsed = removeRoutineExerciseSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await removeRoutineExercise({ userId, routineExerciseId: parsed.data.routineExerciseId });

  revalidatePath("/routines");
  return { success: true } as const;
}
