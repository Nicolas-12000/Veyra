"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { updateRoutineExerciseSchema } from "@/src/modules/routines/schemas";
import { updateRoutineExercise } from "@/src/modules/routines/services";

export async function updateRoutineExerciseAction(payload: unknown) {
  const parsed = updateRoutineExerciseSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  try {
    const userId = await requireUserId();
    await updateRoutineExercise({ userId, ...parsed.data });
    revalidatePath("/routines");
    return { success: true } as const;
  } catch (error) {
    console.error("Error updating routine exercise:", error);
    return { error: "Error al actualizar el ejercicio de la rutina." } as const;
  }
}
