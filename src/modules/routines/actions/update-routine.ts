"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { updateRoutineSchema } from "@/src/modules/routines/schemas";
import { updateRoutine } from "@/src/modules/routines/services";

export async function updateRoutineAction(payload: unknown) {
  const parsed = updateRoutineSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await updateRoutine({ userId, ...parsed.data });

  revalidatePath(`/routines/${parsed.data.routineId}`);
  revalidatePath("/routines");
  return { success: true } as const;
}
