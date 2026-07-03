import { sql } from "drizzle-orm/sql";
import { db } from "@/lib/db";

export type OneRMDataPoint = {
  week: string;
  exerciseId: string;
  exerciseName: string;
  estimated1rm: number;
  bestWeightKg: number;
  bestReps: number;
};

export async function getOneRMHistoryByExercise(params: {
  userId: string;
  exerciseIds: string[];
  periodStart?: Date | null;
}): Promise<OneRMDataPoint[]> {
  if (params.exerciseIds.length === 0) return [];

  const filters = [
    sql`ws.user_id = ${params.userId}`,
    sql`ws.completed = true`,
    sql`sl.exercise_id = ANY(ARRAY[${sql.join(
      params.exerciseIds.map((id) => sql`${id}::uuid`),
      sql`, `
    )}])`,
  ];

  if (params.periodStart) {
    filters.push(sql`ws.session_date >= ${params.periodStart}`);
  }

  const whereSql = sql.join(filters, sql` AND `);

  const result = await db.execute<OneRMDataPoint>(sql`
    SELECT
      date_trunc('week', ws.session_date::timestamp)::date::text AS week,
      sl.exercise_id::text AS "exerciseId",
      e.name AS "exerciseName",
      MAX(sl.weight_kg * (1 + sl.reps / 30.0)) AS "estimated1rm",
      (ARRAY_AGG(sl.weight_kg ORDER BY sl.weight_kg * (1 + sl.reps / 30.0) DESC))[1] AS "bestWeightKg",
      (ARRAY_AGG(sl.reps ORDER BY sl.weight_kg * (1 + sl.reps / 30.0) DESC))[1] AS "bestReps"
    FROM set_logs sl
    JOIN workout_sessions ws ON sl.session_id = ws.id
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE ${whereSql}
    GROUP BY date_trunc('week', ws.session_date::timestamp), sl.exercise_id, e.name
    ORDER BY week ASC, e.name;
  `);

  return result.rows.map((r) => ({
    ...r,
    estimated1rm: Number(r.estimated1rm),
    bestWeightKg: Number(r.bestWeightKg),
    bestReps: Number(r.bestReps),
  }));
}

export type VolumeByMusclePoint = {
  week: string;
  muscleGroup: string;
  volume: number;
};

export async function getVolumeByMuscleWeekly(params: {
  userId: string;
  periodStart?: Date | null;
}): Promise<VolumeByMusclePoint[]> {
  const filters = [
    sql`ws.user_id = ${params.userId}`,
    sql`ws.completed = true`,
  ];

  if (params.periodStart) {
    filters.push(sql`ws.session_date >= ${params.periodStart}`);
  }

  const whereSql = sql.join(filters, sql` AND `);

  const result = await db.execute<VolumeByMusclePoint>(sql`
    SELECT
      date_trunc('week', ws.session_date::timestamp)::date::text AS week,
      e.muscle_group AS "muscleGroup",
      SUM(sl.reps * sl.weight_kg) AS volume
    FROM set_logs sl
    JOIN workout_sessions ws ON sl.session_id = ws.id
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE ${whereSql}
    GROUP BY date_trunc('week', ws.session_date::timestamp), e.muscle_group
    ORDER BY week ASC, e.muscle_group;
  `);

  return result.rows.map((r) => ({
    ...r,
    volume: Number(r.volume),
  }));
}

export type RPEScatterPoint = {
  date: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  rpe: number | null;
  estimated1rm: number;
};

export async function getRPEScatterData(params: {
  userId: string;
  exerciseId: string;
  periodStart?: Date | null;
}): Promise<RPEScatterPoint[]> {
  const filters = [
    sql`ws.user_id = ${params.userId}`,
    sql`ws.completed = true`,
    sql`sl.exercise_id = ${params.exerciseId}::uuid`,
  ];

  if (params.periodStart) {
    filters.push(sql`ws.session_date >= ${params.periodStart}`);
  }

  const whereSql = sql.join(filters, sql` AND `);

  const result = await db.execute<RPEScatterPoint>(sql`
    SELECT
      ws.session_date::text AS date,
      sl.exercise_id::text AS "exerciseId",
      e.name AS "exerciseName",
      sl.weight_kg AS "weightKg",
      sl.reps,
      sl.rpe,
      sl.weight_kg * (1 + sl.reps / 30.0) AS "estimated1rm"
    FROM set_logs sl
    JOIN workout_sessions ws ON sl.session_id = ws.id
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE ${whereSql}
    ORDER BY ws.session_date ASC, sl.set_number ASC;
  `);

  return result.rows.map((r) => ({
    ...r,
    weightKg: Number(r.weightKg),
    reps: Number(r.reps),
    rpe: r.rpe != null ? Number(r.rpe) : null,
    estimated1rm: Number(r.estimated1rm),
  }));
}

export type ExerciseDetailSession = {
  sessionDate: string;
  sets: {
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
  }[];
  estimated1rm: number;
  volume: number;
};

export async function getExerciseDetailHistory(params: {
  userId: string;
  exerciseId: string;
  periodStart?: Date | null;
  limit?: number;
}): Promise<ExerciseDetailSession[]> {
  const filters = [
    sql`ws.user_id = ${params.userId}`,
    sql`ws.completed = true`,
    sql`sl.exercise_id = ${params.exerciseId}::uuid`,
  ];

  if (params.periodStart) {
    filters.push(sql`ws.session_date >= ${params.periodStart}`);
  }

  const whereSql = sql.join(filters, sql` AND `);
  const limitSql = params.limit ? sql`LIMIT ${params.limit}` : sql``;

  const result = await db.execute<{
    sessionDate: string;
    sessionId: string;
    setNumber: number;
    weightKg: string;
    reps: number;
    rpe: string | null;
  }>(sql`
    SELECT
      ws.session_date::text AS "sessionDate",
      ws.id::text AS "sessionId",
      sl.set_number AS "setNumber",
      sl.weight_kg AS "weightKg",
      sl.reps,
      sl.rpe
    FROM set_logs sl
    JOIN workout_sessions ws ON sl.session_id = ws.id
    WHERE ${whereSql}
    ORDER BY ws.session_date DESC, sl.set_number ASC
    ${limitSql};
  `);

  // Group by session
  const sessionMap = new Map<string, ExerciseDetailSession>();

  for (const row of result.rows) {
    const key = row.sessionDate;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        sessionDate: row.sessionDate,
        sets: [],
        estimated1rm: 0,
        volume: 0,
      });
    }
    const session = sessionMap.get(key)!;
    const weightKg = Number(row.weightKg);
    const reps = Number(row.reps);
    const rpe = row.rpe != null ? Number(row.rpe) : null;
    session.sets.push({ setNumber: Number(row.setNumber), weightKg, reps, rpe });
    const e1rm = weightKg * (1 + reps / 30);
    if (e1rm > session.estimated1rm) session.estimated1rm = e1rm;
    session.volume += weightKg * reps;
  }

  return [...sessionMap.values()];
}

export type AdherenceDay = {
  date: string;
  count: number;
  volume: number;
  muscleGroups: string[];
};

export async function getAdherenceData(params: {
  userId: string;
  periodStart: Date;
}): Promise<AdherenceDay[]> {
  const result = await db.execute<{
    date: string;
    volume: string;
    muscleGroups: string;
  }>(sql`
    SELECT
      ws.session_date::text AS date,
      COALESCE(SUM(sl.reps * sl.weight_kg), 0) AS volume,
      STRING_AGG(DISTINCT e.muscle_group::text, ',') AS "muscleGroups"
    FROM workout_sessions ws
    LEFT JOIN set_logs sl ON sl.session_id = ws.id
    LEFT JOIN exercises e ON sl.exercise_id = e.id
    WHERE ws.user_id = ${params.userId}
      AND ws.completed = true
      AND ws.session_date >= ${params.periodStart}
    GROUP BY ws.session_date
    ORDER BY ws.session_date ASC;
  `);

  return result.rows.map((r) => ({
    date: r.date,
    count: 1,
    volume: Number(r.volume),
    muscleGroups: r.muscleGroups ? r.muscleGroups.split(",") : [],
  }));
}

export type SessionSummaryData = {
  sessionId: string;
  sessionDate: string;
  createdAt: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    sets: { setNumber: number; weightKg: number; reps: number; rpe: number | null }[];
    estimated1rm: number;
    volume: number;
  }[];
  totalVolume: number;
  totalSets: number;
};

export async function getSessionSummaryData(params: {
  sessionId: string;
  userId: string;
}): Promise<SessionSummaryData | null> {
  const result = await db.execute<{
    sessionId: string;
    sessionDate: string;
    createdAt: string;
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    setNumber: number;
    weightKg: string;
    reps: number;
    rpe: string | null;
  }>(sql`
    SELECT
      ws.id::text AS "sessionId",
      ws.session_date::text AS "sessionDate",
      ws.created_at::text AS "createdAt",
      sl.exercise_id::text AS "exerciseId",
      e.name AS "exerciseName",
      e.muscle_group AS "muscleGroup",
      sl.set_number AS "setNumber",
      sl.weight_kg AS "weightKg",
      sl.reps,
      sl.rpe
    FROM workout_sessions ws
    JOIN set_logs sl ON sl.session_id = ws.id
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE ws.id = ${params.sessionId}::uuid
      AND ws.user_id = ${params.userId}::uuid
    ORDER BY e.name, sl.set_number;
  `);

  if (result.rows.length === 0) return null;

  const first = result.rows[0];
  const exerciseMap = new Map<string, SessionSummaryData["exercises"][0]>();

  for (const row of result.rows) {
    if (!exerciseMap.has(row.exerciseId)) {
      exerciseMap.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        muscleGroup: row.muscleGroup,
        sets: [],
        estimated1rm: 0,
        volume: 0,
      });
    }
    const ex = exerciseMap.get(row.exerciseId)!;
    const weightKg = Number(row.weightKg);
    const reps = Number(row.reps);
    const rpe = row.rpe != null ? Number(row.rpe) : null;
    ex.sets.push({ setNumber: Number(row.setNumber), weightKg, reps, rpe });
    const e1rm = weightKg * (1 + reps / 30);
    if (e1rm > ex.estimated1rm) ex.estimated1rm = e1rm;
    ex.volume += weightKg * reps;
  }

  const exercises = [...exerciseMap.values()];
  const totalVolume = exercises.reduce((a, e) => a + e.volume, 0);
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);

  return {
    sessionId: first.sessionId,
    sessionDate: first.sessionDate,
    createdAt: first.createdAt,
    exercises,
    totalVolume,
    totalSets,
  };
}
