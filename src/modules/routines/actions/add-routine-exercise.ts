"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { addRoutineExerciseSchema } from "@/src/modules/routines/schemas";
import { addRoutineExercise } from "@/src/modules/routines/services";

export async function addRoutineExerciseAction(payload: unknown) {
  const parsed = addRoutineExerciseSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  const row = await addRoutineExercise({ userId, ...parsed.data });

  revalidatePath("/routines");
  return { success: true, routineExerciseId: row.id } as const;
}
