"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { reorderRoutineExercisesSchema } from "@/src/modules/routines/schemas";
import { reorderRoutineExercises } from "@/src/modules/routines/services";

export async function reorderRoutineExercisesAction(payload: unknown) {
  const parsed = reorderRoutineExercisesSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await reorderRoutineExercises({ userId, ...parsed.data });

  revalidatePath("/routines");
  return { success: true } as const;
}
