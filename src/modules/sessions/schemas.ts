import { z } from "zod";

export const startSessionSchema = z.object({
  routineId: z.string().uuid().optional(),
  routineDayId: z.string().uuid().optional(),
  sessionDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  sessionConfig: z.record(z.string(), z.unknown()).optional(),
});

export const logSetSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  weight: z.number().positive(),
  unit: z.enum(["kg", "lb"]),
  rpe: z.number().min(6).max(10).optional(),
  isLastSet: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export const completeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const applySessionOverrideSchema = z.object({
  sessionId: z.string().uuid(),
  routineExerciseId: z.string().uuid(),
  overrides: z
    .object({
      targetRepsMin: z.number().int().min(1).optional(),
      targetRepsMax: z.number().int().min(1).optional(),
      restTime: z.string().max(100).optional(),
      substituteExerciseId: z.string().uuid().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one override is required",
    }),
});
