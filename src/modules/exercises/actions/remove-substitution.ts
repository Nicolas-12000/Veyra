"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { removeSubstitutionSchema } from "@/src/modules/exercises/schemas";
import { removeSubstitution } from "@/src/modules/exercises/services";

export async function removeSubstitutionAction(payload: unknown) {
  const parsed = removeSubstitutionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  await requireUserId();
  await removeSubstitution(parsed.data);

  revalidatePath("/exercises");
  return { success: true } as const;
}
