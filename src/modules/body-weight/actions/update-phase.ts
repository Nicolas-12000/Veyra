"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { updatePhaseSchema } from "@/src/modules/body-weight/schemas";
import {
  getLatestWeight,
  upsertUserPhase,
} from "@/src/modules/body-weight/services";

export async function updatePhase(payload: unknown) {
  const parsed = updatePhaseSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  const latestWeight = await getLatestWeight(userId);

  await upsertUserPhase({
    userId,
    phase: parsed.data.phase,
    weeklyChangeKg: parsed.data.weeklyChangeKg,
    phaseStartDate: parsed.data.phaseStartDate ?? new Date(),
    startingWeightKg: latestWeight,
  });

  revalidatePath("/body-weight");
  return { success: true } as const;
}
