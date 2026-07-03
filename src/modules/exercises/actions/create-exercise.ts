"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { createExerciseSchema } from "@/src/modules/exercises/schemas";
import { createExercise } from "@/src/modules/exercises/services";

export async function createExerciseAction(payload: unknown) {
  const parsed = createExerciseSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  await requireUserId();
  const row = await createExercise(parsed.data);

  revalidatePath("/exercises");
  return { success: true, exerciseId: row.id } as const;
}
