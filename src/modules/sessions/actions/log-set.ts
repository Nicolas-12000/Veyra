"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { logSetSchema } from "@/src/modules/sessions/schemas";
import {
  assertSessionOwnership,
  insertSet,
} from "@/src/modules/sessions/services";
import { toKg } from "@/shared/utils/units";

export async function logSet(payload: unknown) {
  const parsed = logSetSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await assertSessionOwnership(parsed.data.sessionId, userId);

  const weightKg =
    parsed.data.unit === "lb" ? toKg(parsed.data.weight) : parsed.data.weight;

  await insertSet({
    sessionId: parsed.data.sessionId,
    exerciseId: parsed.data.exerciseId,
    setNumber: parsed.data.setNumber,
    reps: parsed.data.reps,
    weightKg,
    rpe: parsed.data.rpe,
    isLastSet: parsed.data.isLastSet,
    notes: parsed.data.notes,
  });

  revalidatePath(`/session/${parsed.data.sessionId}`);
  return { success: true } as const;
}
