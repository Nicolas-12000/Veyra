"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { removeRoutineDaySchema } from "@/src/modules/routines/schemas";
import { removeRoutineDay } from "@/src/modules/routines/services";

export async function removeRoutineDayAction(payload: unknown) {
  const parsed = removeRoutineDaySchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await removeRoutineDay({ userId, routineDayId: parsed.data.routineDayId });

  revalidatePath("/routines");
  return { success: true } as const;
}
