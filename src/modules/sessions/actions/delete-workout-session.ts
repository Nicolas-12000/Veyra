"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/src/modules/auth/server";
import { deleteWorkoutSession } from "@/src/modules/sessions/services";
import { z } from "zod";

const deleteSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function deleteWorkoutSessionAction(payload: unknown) {
  const parsed = deleteSessionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "ID de sesión inválido" } as const;
  }

  try {
    const userId = await requireUserId();
    await deleteWorkoutSession(parsed.data.sessionId, userId);
  } catch (error) {
    return { error: "No autorizado o error al eliminar la sesión" } as const;
  }

  redirect("/dashboard");
}
