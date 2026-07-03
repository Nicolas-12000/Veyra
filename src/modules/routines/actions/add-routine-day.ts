"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { addRoutineDaySchema } from "@/src/modules/routines/schemas";
import { addRoutineDay } from "@/src/modules/routines/services";

export async function addRoutineDayAction(payload: unknown) {
  const parsed = addRoutineDaySchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  const row = await addRoutineDay({ userId, ...parsed.data });

  revalidatePath(`/routines/${parsed.data.routineId}`);
  return { success: true, routineDayId: row.id } as const;
}
