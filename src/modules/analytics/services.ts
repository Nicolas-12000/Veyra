import { sql } from "drizzle-orm/sql";

import { db } from "@/lib/db";

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  best1rm: number;
  volume: number;
  lastTrained: Date | null;
  avgRpe: number | null;
};

export async function getExerciseSummaryForPeriod(params: {
  userId: string;
  periodStart?: Date | null;
}) {
  const filters = [sql`ws.user_id = ${params.userId}`];

  if (params.periodStart) {
    filters.push(sql`ws.session_date >= ${params.periodStart}`);
  }

  const whereSql = sql.join(filters, sql` AND `);

  const result = await db.execute<ExerciseSummary>(sql`
    SELECT
      sl.exercise_id AS "exerciseId",
      e.name AS name,
      e.muscle_group AS "muscleGroup",
      MAX(sl.weight_kg * (1 + sl.reps / 30.0)) AS "best1rm",
      SUM(sl.reps * sl.weight_kg) AS volume,
      MAX(ws.session_date) AS "lastTrained",
      AVG(sl.rpe) AS "avgRpe"
    FROM set_logs sl
    JOIN workout_sessions ws ON sl.session_id = ws.id
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE ${whereSql}
    GROUP BY sl.exercise_id, e.name, e.muscle_group
    ORDER BY e.name;
  `);

  return result.rows;
}

export async function getExerciseSummaryForPeriodWithPrevious(params: {
  userId: string;
  periodStart?: Date | null;
  periodEnd?: Date | null; // inclusive start-end for previous window computation
}) {
  // current period summary
  const current = await getExerciseSummaryForPeriod({ userId: params.userId, periodStart: params.periodStart });

  // if no periodStart provided, we cannot compute previous period reliably
  if (!params.periodStart || !params.periodEnd) {
    return { current, previous: [] as ExerciseSummary[] };
  }

  const prevStart = new Date(params.periodStart);
  const prevEnd = new Date(params.periodEnd);
  const delta = params.periodEnd.getTime() - params.periodStart.getTime();
  prevStart.setTime(params.periodStart.getTime() - delta);
  prevEnd.setTime(params.periodEnd.getTime() - delta);

  const filtersPrev = [sql`ws.user_id = ${params.userId}`, sql`ws.session_date >= ${prevStart}`, sql`ws.session_date < ${params.periodStart}`];
  const wherePrev = sql.join(filtersPrev, sql` AND `);

  const prevResult = await db.execute<ExerciseSummary>(sql`
    SELECT
      sl.exercise_id AS "exerciseId",
      e.name AS name,
      e.muscle_group AS "muscleGroup",
      MAX(sl.weight_kg * (1 + sl.reps / 30.0)) AS "best1rm",
      SUM(sl.reps * sl.weight_kg) AS volume,
      MAX(ws.session_date) AS "lastTrained",
      AVG(sl.rpe) AS "avgRpe"
    FROM set_logs sl
    JOIN workout_sessions ws ON sl.session_id = ws.id
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE ${wherePrev}
    GROUP BY sl.exercise_id, e.name, e.muscle_group
    ORDER BY e.name;
  `);

  return { current, previous: prevResult.rows };
}
