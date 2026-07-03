"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OneRMDataPoint } from "@/src/modules/analytics/queries";

const EXERCISE_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "var(--color-chart-brazos)",
  "var(--color-chart-core)"
];

type PhaseMarker = {
  date: string;
  phase: string;
};

type Props = {
  data: OneRMDataPoint[];
  exerciseIds: string[];
  unit: "kg" | "lb";
  phaseMarkers?: PhaseMarker[];
};

const KG_TO_LB = 2.20462;

function convertWeight(kg: number, unit: "kg" | "lb") {
  return unit === "lb" ? kg * KG_TO_LB : kg;
}

function formatWeek(dateStr: string) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return format(d, "d MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export function OneRMChart({ data, exerciseIds, unit, phaseMarkers = [] }: Props) {
  if (!data.length || !exerciseIds.length) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "240px", color: "var(--color-ink-dimmed)" }}
      >
        <span className="text-body">Sin datos para el período seleccionado</span>
      </div>
    );
  }

  // Pivot data: week → { exerciseId: value }
  const allWeeks = [...new Set(data.map((d) => d.week))].sort();
  const chartData = allWeeks.map((week) => {
    const point: Record<string, string | number> = { week };
    for (const exId of exerciseIds) {
      const found = data.find((d) => d.week === week && d.exerciseId === exId);
      if (found) {
        point[exId] = convertWeight(found.estimated1rm, unit);
      }
    }
    return point;
  });

  // Map exerciseId → name
  const nameMap = new Map<string, string>();
  for (const d of data) {
    nameMap.set(d.exerciseId, d.exerciseName);
  }

  // Y-axis domain
  const allVals = chartData.flatMap((p) =>
    exerciseIds.map((id) => p[id] as number | undefined).filter((v): v is number => v != null)
  );
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 100;
  const padding = Math.max((maxVal - minVal) * 0.15, 5);
  const yMin = Math.floor((minVal - padding) * 10) / 10;
  const yMax = Math.ceil((maxVal + padding) * 10) / 10;

  // X-axis ticks
  const xTicks = allWeeks.filter((_, i) => i % Math.max(1, Math.ceil(allWeeks.length / 8)) === 0);

  return (
    <div style={{ width: "100%", height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="week"
            ticks={xTicks}
            tickFormatter={formatWeek}
            tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
            tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div
                  style={{
                    background: "var(--color-canvas-overlay)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    minWidth: "180px",
                  }}
                >
                  <div
                    style={{
                      color: "var(--color-ink-muted)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    {formatWeek(String(label ?? ""))}
                  </div>
                  {payload.map((p, i) => (
                    <div
                      key={String(p.dataKey)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        marginBottom: i < payload.length - 1 ? "4px" : 0,
                      }}
                    >
                      <span style={{ color: "var(--color-ink-muted)", fontSize: "12px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nameMap.get(String(p.dataKey)) ?? String(p.dataKey)}
                      </span>
                      <span style={{ color: p.stroke as string, fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}>
                        {Number(p.value).toFixed(1)} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />

          {/* Phase markers */}
          {phaseMarkers.map((m) => (
            <ReferenceLine
              key={m.date}
              x={m.date}
              stroke="var(--color-border-strong)"
              strokeDasharray="4 4"
              label={{ value: m.phase, fill: "var(--color-ink-dimmed)", fontSize: 10, position: "insideTopRight" }}
            />
          ))}

          {exerciseIds.map((exId, i) => (
            <Line
              key={exId}
              dataKey={exId}
              stroke={EXERCISE_COLORS[i % EXERCISE_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3, fill: EXERCISE_COLORS[i % EXERCISE_COLORS.length], stroke: "var(--color-canvas-base)", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: EXERCISE_COLORS[i % EXERCISE_COLORS.length], stroke: "var(--color-canvas-base)", strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 pl-11">
        {exerciseIds.map((exId, i) => (
          <div key={exId} className="flex items-center gap-2">
            <svg width="24" height="2" viewBox="0 0 24 2">
              <line
                x1="0" y1="1" x2="24" y2="1"
                stroke={EXERCISE_COLORS[i % EXERCISE_COLORS.length]}
                strokeWidth="2"
              />
            </svg>
            <span className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>
              {nameMap.get(exId) ?? exId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
