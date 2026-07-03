import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const auth = pgSchema("auth");

export const authUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
});

export const unitPref = pgEnum("unit_pref", ["kg", "lb"]);
export const phase = pgEnum("phase", ["volumen", "definicion", "recomposicion"]);
export const splitType = pgEnum("split_type", [
  "push",
  "pull",
  "legs",
  "upper",
  "lower",
  "full_body",
  "rest",
]);
export const movementPattern = pgEnum("movement_pattern", [
  "empuje_horizontal",
  "empuje_vertical",
  "jale_horizontal",
  "jale_vertical",
  "sentadilla",
  "bisagra",
  "aislamiento",
  "core",
]);
export const mechanic = pgEnum("mechanic", ["compound", "isolation"]);
export const muscleGroup = pgEnum("muscle_group", [
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
]);

export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => authUsers.id),
  name: text("name").notNull(),
  description: text("description"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const routineDays = pgTable("routine_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id")
    .references(() => routines.id, { onDelete: "cascade" })
    .notNull(),
  dayOrder: integer("day_order").notNull(),
  dayLabel: text("day_label"),
  splitType: splitType("split_type"),
  isRestDay: boolean("is_rest_day").default(false),
  daysOfWeek: text("days_of_week"),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  muscleGroup: muscleGroup("muscle_group").notNull(),
  movementPattern: movementPattern("movement_pattern"),
  mechanic: mechanic("mechanic"),
  isBilateral: boolean("is_bilateral").default(true),
  videoUrl: text("video_url"),
  isCustom: boolean("is_custom").default(false),
});

export const exerciseSubstitutions = pgTable(
  "exercise_substitutions",
  {
    mainExerciseId: uuid("main_exercise_id")
      .references(() => exercises.id)
      .notNull(),
    subExerciseId: uuid("sub_exercise_id")
      .references(() => exercises.id)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.mainExerciseId, table.subExerciseId] }),
  })
);

export const routineExercises = pgTable("routine_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineDayId: uuid("routine_day_id")
    .references(() => routineDays.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  orderInDay: integer("order_in_day").notNull(),
  targetSets: integer("target_sets").notNull().default(3),
  warmupSets: text("warmup_sets"),
  targetRepsMin: integer("target_reps_min"),
  targetRepsMax: integer("target_reps_max"),
  restTime: text("rest_time"),
  earlySetRpe: text("early_set_rpe"),
  lastSetRpe: text("last_set_rpe"),
  lastSetTechnique: text("last_set_technique"),
  notes: text("notes"),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => authUsers.id),
  routineId: uuid("routine_id").references(() => routines.id),
  routineDayId: uuid("routine_day_id").references(() => routineDays.id),
  sessionDate: date("session_date").notNull(),
  notes: text("notes"),
  completed: boolean("completed").default(false),
  sessionConfig: jsonb("session_config").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const setLogs = pgTable("set_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => workoutSessions.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 3 }).notNull(),
  rpe: numeric("rpe", { precision: 3, scale: 1 }),
  isLastSet: boolean("is_last_set").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const weeklyMetrics = pgTable(
  "weekly_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => authUsers.id),
    recordedDate: date("recorded_date").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
    notes: text("notes"),
  },
  (table) => ({
    uniqueUserDate: uniqueIndex("weekly_metrics_user_date").on(
      table.userId,
      table.recordedDate
    ),
  })
);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id),
  unitPref: unitPref("unit_pref").default("kg"),
  currentPhase: phase("current_phase").default("volumen"),
  startingWeightKg: numeric("starting_weight_kg", { precision: 5, scale: 2 }),
  targetWeeklyChangeKg: numeric("target_weekly_change_kg", {
    precision: 4,
    scale: 3,
  }),
  phaseStartDate: date("phase_start_date"),
  activeRoutineId: uuid("active_routine_id").references(() => routines.id),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const phaseHistory = pgTable("phase_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => authUsers.id).notNull(),
  phase: phase("phase").notNull(),
  startDate: date("start_date").notNull(),
  startingWeightKg: numeric("starting_weight_kg", { precision: 5, scale: 2 }),
  targetWeeklyChangeKg: numeric("target_weekly_change_kg", { precision: 4, scale: 3 }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});
