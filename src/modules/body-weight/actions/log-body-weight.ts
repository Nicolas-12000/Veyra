"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { logBodyWeightSchema } from "@/src/modules/body-weight/schemas";
import { upsertWeeklyMetric } from "@/src/modules/body-weight/services";

export async function logBodyWeight(payload: unknown) {
  const parsed = logBodyWeightSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await upsertWeeklyMetric({
    userId,
    recordedDate: parsed.data.recordedDate ?? new Date(),
    weightKg: parsed.data.weightKg,
    notes: parsed.data.notes,
  });

  revalidatePath("/body-weight");
  return { success: true } as const;
}
