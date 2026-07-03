import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { phaseHistory, userProfiles, weeklyMetrics } from "@/drizzle/schema";

export async function deleteWeeklyMetric(id: string, userId: string) {
  await db
    .delete(weeklyMetrics)
    .where(and(eq(weeklyMetrics.id, id), eq(weeklyMetrics.userId, userId)));
}

export async function updateWeeklyMetric(
  id: string,
  userId: string,
  params: {
    weightKg: number;
    recordedDate: Date;
    notes?: string;
  }
) {
  const recordedDateStr = params.recordedDate.toISOString().split('T')[0];
  const weightStr = String(params.weightKg);

  await db
    .update(weeklyMetrics)
    .set({
      weightKg: weightStr,
      recordedDate: recordedDateStr,
      notes: params.notes ?? null,
    })
    .where(and(eq(weeklyMetrics.id, id), eq(weeklyMetrics.userId, userId)));
}

export async function upsertWeeklyMetric(params: {
  userId: string;
  recordedDate: Date;
  weightKg: number;
  notes?: string;
}) {
  // Drizzle maps numeric/date DB types to strings in TS types. Convert accordingly.
  const recordedDateStr = params.recordedDate.toISOString().split('T')[0];
  const weightStr = String(params.weightKg);

  await db
    .insert(weeklyMetrics)
    .values({
      userId: params.userId,
      recordedDate: recordedDateStr,
      weightKg: weightStr,
      notes: params.notes,
    })
    .onConflictDoUpdate({
      target: [weeklyMetrics.userId, weeklyMetrics.recordedDate],
      set: {
        weightKg: weightStr,
        notes: params.notes,
      },
    });
}

export async function getLatestWeight(userId: string) {
  const [row] = await db
    .select({ weightKg: weeklyMetrics.weightKg })
    .from(weeklyMetrics)
    .where(eq(weeklyMetrics.userId, userId))
    .orderBy(desc(weeklyMetrics.recordedDate))
    .limit(1);

  if (!row?.weightKg) return null;
  return Number(row.weightKg);
}

export async function getWeeklyMetrics(userId: string, since?: Date | null) {
  const sinceStr = since ? since.toISOString().split('T')[0] : null;
  const sinceClause = sinceStr ? sql`AND weekly_metrics.recorded_date >= ${sinceStr}` : sql``;

  const result = await db.execute<{ id: string; recordedDate: string; weightKg: string; notes: string | null }>(sql`
    SELECT id, recorded_date AS "recordedDate", weight_kg AS "weightKg", notes
    FROM weekly_metrics
    WHERE user_id = ${userId} ${sinceClause}
    ORDER BY recorded_date
  `);

  return result.rows;
}

export async function getUserProfile(userId: string) {
  const [row] = await db
    .select({
      unitPref: userProfiles.unitPref,
      currentPhase: userProfiles.currentPhase,
      startingWeightKg: userProfiles.startingWeightKg,
      targetWeeklyChangeKg: userProfiles.targetWeeklyChangeKg,
      phaseStartDate: userProfiles.phaseStartDate,
      activeRoutineId: userProfiles.activeRoutineId,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId));

  return row ?? null;
}

export async function upsertUserPhase(params: {
  userId: string;
  phase: "volumen" | "definicion" | "recomposicion";
  weeklyChangeKg: number;
  phaseStartDate: Date;
  startingWeightKg: number | null;
}) {
  const phaseStartStr = params.phaseStartDate.toISOString().split('T')[0];
  const weeklyChangeStr = String(params.weeklyChangeKg);
  const startingWeightStr = params.startingWeightKg != null ? String(params.startingWeightKg) : undefined;

  await db
    .insert(userProfiles)
    .values({
      id: params.userId,
      currentPhase: params.phase,
      targetWeeklyChangeKg: weeklyChangeStr,
      phaseStartDate: phaseStartStr,
      startingWeightKg: startingWeightStr ?? undefined,
    })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: {
        currentPhase: params.phase,
        targetWeeklyChangeKg: weeklyChangeStr,
        phaseStartDate: phaseStartStr,
        startingWeightKg: startingWeightStr ?? undefined,
      },
    });
}

export type PhaseHistoryEntry = {
  id: string;
  phase: "volumen" | "definicion" | "recomposicion";
  startDate: string;
  startingWeightKg: number | null;
  targetWeeklyChangeKg: number | null;
  note: string | null;
};

export async function getPhaseHistory(userId: string): Promise<PhaseHistoryEntry[]> {
  const rows = await db
    .select({
      id: phaseHistory.id,
      phase: phaseHistory.phase,
      startDate: phaseHistory.startDate,
      startingWeightKg: phaseHistory.startingWeightKg,
      targetWeeklyChangeKg: phaseHistory.targetWeeklyChangeKg,
      note: phaseHistory.note,
    })
    .from(phaseHistory)
    .where(eq(phaseHistory.userId, userId))
    .orderBy(desc(phaseHistory.startDate));

  return rows.map((r) => ({
    id: r.id,
    phase: r.phase as "volumen" | "definicion" | "recomposicion",
    startDate: String(r.startDate),
    startingWeightKg: r.startingWeightKg != null ? Number(r.startingWeightKg) : null,
    targetWeeklyChangeKg: r.targetWeeklyChangeKg != null ? Number(r.targetWeeklyChangeKg) : null,
    note: r.note ?? null,
  }));
}
