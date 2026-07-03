"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/src/modules/auth/server";
import {
  assertRoutineOwnership,
  setActiveRoutine,
} from "@/src/modules/routines/services";

const switchSchema = z.string().uuid();

export async function switchActiveRoutine(routineId: string) {
  const parsed = switchSchema.safeParse(routineId);
  if (!parsed.success) {
    return { error: "ID de rutina inválido" } as const;
  }

  const userId = await requireUserId();
  await assertRoutineOwnership(parsed.data, userId);
  await setActiveRoutine(userId, parsed.data);

  revalidatePath("/routines");
  return { success: true } as const;
}
