"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/src/modules/auth/server";
import { deleteWeeklyMetric } from "@/src/modules/body-weight/services";
import { z } from "zod";

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteBodyWeightAction(payload: unknown) {
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "ID inválido." } as const;
  }

  try {
    const userId = await requireUserId();
    await deleteWeeklyMetric(parsed.data.id, userId);
    revalidatePath("/body-weight");
    return { success: true } as const;
  } catch (error) {
    return { error: "No autorizado o error al eliminar." } as const;
  }
}
