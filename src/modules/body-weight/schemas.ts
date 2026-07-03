import { z } from "zod";

export const logBodyWeightSchema = z.object({
  recordedDate: z.coerce.date().optional(),
  weightKg: z.number().positive(),
  notes: z.string().max(2000).optional(),
});

export const updatePhaseSchema = z.object({
  phase: z.enum(["volumen", "definicion", "recomposicion"]),
  weeklyChangeKg: z.number(),
  phaseStartDate: z.coerce.date().optional(),
});
