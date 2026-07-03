import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireUserId } from '@/src/modules/auth/server';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const url = new URL(req.url);
    const format = (url.searchParams.get('format') || 'csv').toLowerCase();
    const sinceParam = url.searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : null;

    const filters = [sql`ws.user_id = ${userId}`];
    if (since) filters.push(sql`ws.session_date >= ${since}`);
    const whereSql = sql.join(filters, sql` AND `);

    type Row = {
      session_id: string;
      session_date: string | Date | null;
      set_number: number | null;
      reps: number | null;
      weight_kg: string | number | null;
      rpe: string | number | null;
      notes: string | null;
      exercise_name: string | null;
    };

    const result = await db.execute<Row>(sql`
      SELECT
        ws.id AS session_id,
        ws.session_date,
        sl.set_number,
        sl.reps,
        sl.weight_kg,
        sl.rpe,
        sl.notes,
        e.name AS exercise_name
      FROM set_logs sl
      JOIN workout_sessions ws ON sl.session_id = ws.id
      JOIN exercises e ON sl.exercise_id = e.id
      WHERE ${whereSql}
      ORDER BY ws.session_date, ws.id, sl.set_number;
    `);

    const rows = result.rows;

    if (format === 'json') {
      return NextResponse.json({ rows });
    }

    // default CSV
    const header = ['session_id', 'session_date', 'set_number', 'reps', 'weight_kg', 'rpe', 'notes', 'exercise_name'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const line = [
        escapeCsv(r.session_id),
        escapeCsv(r.session_date instanceof Date ? r.session_date.toISOString() : r.session_date),
        escapeCsv(r.set_number),
        escapeCsv(r.reps),
        escapeCsv(r.weight_kg),
        escapeCsv(r.rpe),
        escapeCsv(r.notes),
        escapeCsv(r.exercise_name),
      ].join(',');
      lines.push(line);
    }

    const csv = lines.join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="veyra-export-${userId}.csv"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
