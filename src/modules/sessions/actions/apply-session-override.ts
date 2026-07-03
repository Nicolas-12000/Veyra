"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { applySessionOverrideSchema } from "@/src/modules/sessions/schemas";
import {
  applySessionOverride,
  assertSessionOwnership,
} from "@/src/modules/sessions/services";

export async function applySessionOverrideAction(payload: unknown) {
  const parsed = applySessionOverrideSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await assertSessionOwnership(parsed.data.sessionId, userId);

  await applySessionOverride({
    sessionId: parsed.data.sessionId,
    routineExerciseId: parsed.data.routineExerciseId,
    overrides: parsed.data.overrides,
  });

  revalidatePath(`/session/${parsed.data.sessionId}`);
  return { success: true } as const;
}
