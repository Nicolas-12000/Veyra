"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/src/modules/auth/server";
import { updateWeeklyMetric } from "@/src/modules/body-weight/services";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string().uuid(),
  weightKg: z.number().positive(),
  recordedDate: z.coerce.date(),
  notes: z.string().max(200).optional(),
});

export async function updateBodyWeightAction(payload: unknown) {
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  try {
    const userId = await requireUserId();
    await updateWeeklyMetric(parsed.data.id, userId, {
      weightKg: parsed.data.weightKg,
      recordedDate: parsed.data.recordedDate,
      notes: parsed.data.notes,
    });
    revalidatePath("/body-weight");
    return { success: true } as const;
  } catch (error) {
    console.error("Error updating body weight:", error);
    return { error: "Error al actualizar. Posiblemente ya tienes un registro en esa fecha." } as const;
  }
}
