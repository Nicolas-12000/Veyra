"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { createRoutineSchema } from "@/src/modules/routines/schemas";
import { createRoutine } from "@/src/modules/routines/services";

export async function createRoutineAction(payload: unknown) {
  const parsed = createRoutineSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  const row = await createRoutine({ userId, ...parsed.data });

  revalidatePath("/routines");
  return { success: true, routineId: row.id } as const;
}
