"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireUserId } from "@/src/modules/auth/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/drizzle/schema";

const schema = z.object({
  unitPref: z.enum(["kg", "lb"]),
});

export async function updateUnitPref(payload: unknown) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Unidad inválida" } as const;
  }

  const userId = await requireUserId();

  await db
    .insert(userProfiles)
    .values({
      id: userId,
      unitPref: parsed.data.unitPref,
    })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: { unitPref: parsed.data.unitPref },
    });

  revalidatePath("/profile");
  revalidatePath("/body-weight");
  revalidatePath("/dashboard");

  return { success: true } as const;
}
