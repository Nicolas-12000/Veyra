import { z } from "zod";

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export const updateRoutineSchema = z.object({
  routineId: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const archiveRoutineSchema = z.object({
  routineId: z.string().uuid(),
});

export const restoreRoutineSchema = z.object({
  routineId: z.string().uuid(),
});

export const addRoutineDaySchema = z.object({
  routineId: z.string().uuid(),
  dayOrder: z.number().int().min(1),
  dayLabel: z.string().max(120).optional(),
  splitType: z
    .enum(["push", "pull", "legs", "upper", "lower", "full_body", "rest"])
    .optional(),
  isRestDay: z.boolean().optional(),
  daysOfWeek: z.string().optional(),
});

export const removeRoutineDaySchema = z.object({
  routineDayId: z.string().uuid(),
});

export const addRoutineExerciseSchema = z.object({
  routineDayId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  orderInDay: z.number().int().min(1),
  targetSets: z.number().int().min(1).optional(),
  warmupSets: z.string().max(20).optional(),
  targetRepsMin: z.number().int().min(1).optional(),
  targetRepsMax: z.number().int().min(1).optional(),
  restTime: z.string().max(100).optional(),
  earlySetRpe: z.string().max(20).optional(),
  lastSetRpe: z.string().max(20).optional(),
  lastSetTechnique: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateRoutineExerciseSchema = z.object({
  routineExerciseId: z.string().uuid(),
  targetSets: z.number().int().min(1).optional(),
  warmupSets: z.string().max(20).nullable().optional(),
  targetRepsMin: z.number().int().min(1).nullable().optional(),
  targetRepsMax: z.number().int().min(1).nullable().optional(),
  restTime: z.string().max(100).nullable().optional(),
  earlySetRpe: z.string().max(20).nullable().optional(),
  lastSetRpe: z.string().max(20).nullable().optional(),
  lastSetTechnique: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const removeRoutineExerciseSchema = z.object({
  routineExerciseId: z.string().uuid(),
});

export const reorderRoutineExercisesSchema = z.object({
  routineDayId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});
