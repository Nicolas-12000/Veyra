import { z } from "zod";

export const createExerciseSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100, "Máximo 100 caracteres.").trim(),
  muscleGroup: z.enum([
    "pecho",
    "espalda",
    "hombros",
    "biceps",
    "triceps",
    "cuadriceps",
    "isquios",
    "gluteos",
    "pantorrillas",
    "core",
  ]),
  movementPattern: z
    .enum([
      "empuje_horizontal",
      "empuje_vertical",
      "jale_horizontal",
      "jale_vertical",
      "sentadilla",
      "bisagra",
      "aislamiento",
      "core",
    ])
    .optional(),
  mechanic: z.enum(["compound", "isolation"]).optional(),
  isBilateral: z.boolean().optional(),
  videoUrl: z.string().url().optional(),
});

export const addSubstitutionSchema = z.object({
  mainExerciseId: z.string().uuid(),
  subExerciseId: z.string().uuid(),
});

export const removeSubstitutionSchema = z.object({
  mainExerciseId: z.string().uuid(),
  subExerciseId: z.string().uuid(),
});
