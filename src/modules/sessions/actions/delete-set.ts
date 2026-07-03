"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/src/modules/auth/server";
import { assertSessionOwnership, deleteSet } from "@/src/modules/sessions/services";
import { z } from "zod";

const deleteSetSchema = z.object({
  setId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export async function deleteSetAction(payload: unknown) {
  const parsed = deleteSetSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Datos inválidos" } as const;
  }

  try {
    const userId = await requireUserId();
    // Validate session ownership before deleting
    await assertSessionOwnership(parsed.data.sessionId, userId);
    
    await deleteSet(parsed.data.setId, parsed.data.sessionId);
    
    revalidatePath(`/session/${parsed.data.sessionId}`);
    return { success: true } as const;
  } catch (error) {
    console.error("Error deleting set:", error);
    return { error: "No autorizado o error al eliminar el set" } as const;
  }
}
