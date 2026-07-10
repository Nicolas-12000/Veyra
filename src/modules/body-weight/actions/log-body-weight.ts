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

  if (parsed.data.recordedDate && isNaN(parsed.data.recordedDate.getTime())) {
    return { error: "Fecha inválida." } as const;
  }

  try {
    const userId = await requireUserId();
    await upsertWeeklyMetric({
      userId,
      recordedDate: parsed.data.recordedDate ?? new Date(),
      weightKg: parsed.data.weightKg,
      notes: parsed.data.notes,
    });

    revalidatePath("/body-weight");
    return { success: true } as const;
  } catch (error) {
    console.error("Error logging body weight:", error);
    return { error: "Error al guardar el peso. Intenta de nuevo." } as const;
  }
}
