"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { completeSessionSchema } from "@/src/modules/sessions/schemas";
import { markSessionComplete } from "@/src/modules/sessions/services";

export async function completeSession(payload: unknown) {
  const parsed = completeSessionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  const userId = await requireUserId();
  await markSessionComplete(parsed.data.sessionId, userId);

  revalidatePath("/dashboard");
  revalidatePath(`/session/${parsed.data.sessionId}`);
  return { success: true } as const;
}
