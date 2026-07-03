"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { startSessionSchema } from "@/src/modules/sessions/schemas";
import { createSession } from "@/src/modules/sessions/services";

export async function startSession(payload: unknown) {
  const parsed = startSessionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  const row = await createSession({ userId, ...parsed.data });

  revalidatePath("/session");
  return { success: true, sessionId: row.id } as const;
}
