"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/src/modules/auth/server";
import { restoreRoutineSchema } from "@/src/modules/routines/schemas";
import { restoreRoutine } from "@/src/modules/routines/services";

export async function restoreRoutineAction(payload: unknown) {
  const parsed = restoreRoutineSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await restoreRoutine({ userId, routineId: parsed.data.routineId });

  revalidatePath("/routines");
  revalidatePath(`/routines/${parsed.data.routineId}`);
  return { success: true } as const;
}