"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/src/modules/auth/server";
import { addSubstitutionSchema } from "@/src/modules/exercises/schemas";
import { addSubstitution } from "@/src/modules/exercises/services";

export async function addSubstitutionAction(payload: unknown) {
  const parsed = addSubstitutionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  await requireUserId();
  await addSubstitution(parsed.data);

  revalidatePath("/exercises");
  return { success: true } as const;
}
