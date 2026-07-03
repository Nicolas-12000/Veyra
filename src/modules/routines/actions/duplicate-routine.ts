"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/src/modules/auth/server";
import {
  assertRoutineOwnership,
  cloneRoutine,
} from "@/src/modules/routines/services";

const duplicateSchema = z.string().uuid();

export async function duplicateRoutine(sourceRoutineId: string) {
  const parsed = duplicateSchema.safeParse(sourceRoutineId);
  if (!parsed.success) {
    return { error: "ID de rutina inválido" } as const;
  }

  const userId = await requireUserId();
  await assertRoutineOwnership(parsed.data, userId);
  const { routineId } = await cloneRoutine({ userId, sourceRoutineId: parsed.data });

  revalidatePath("/routines");
  redirect(`/routines/${routineId}`);
}
