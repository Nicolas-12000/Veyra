"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { archiveRoutineSchema } from "@/src/modules/routines/schemas";
import { archiveRoutine } from "@/src/modules/routines/services";

export async function archiveRoutineAction(payload: unknown) {
  const parsed = archiveRoutineSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await archiveRoutine({ userId, routineId: parsed.data.routineId });

  revalidatePath("/routines");
  return { success: true } as const;
}
