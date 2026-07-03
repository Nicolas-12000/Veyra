"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { VolumeByMusclePoint } from "@/src/modules/analytics/queries";

const MUSCLE_COLORS: Record<string, string> = {
  pecho: "var(--color-chart-pecho)",
  espalda: "var(--color-chart-espalda)",
  hombros: "var(--color-chart-hombros)",
  biceps: "var(--color-chart-brazos)",
  triceps: "var(--color-chart-brazos)",
  cuadriceps: "var(--color-chart-pierna)",
  isquios: "var(--color-chart-pierna)",
  gluteos: "var(--color-chart-pierna)",
  pantorrillas: "var(--color-chart-pierna)",
  core: "var(--color-chart-core)",
};

const MUSCLE_LABELS: Record<string, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  cuadriceps: "Cuádriceps",
  isquios: "Isquios",
  gluteos: "Glúteos",
  pantorrillas: "Pantorrillas",
  core: "Core",
};

type Props = {
  data: VolumeByMusclePoint[];
  unit: "kg" | "lb";
};

const KG_TO_LB = 2.20462;

function formatWeek(dateStr: string) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return format(d, "d MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export function VolumeByMuscleChart({ data, unit }: Props) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "240px", color: "var(--color-ink-dimmed)" }}
      >
        <span className="text-body">Sin datos para el período seleccionado</span>
      </div>
    );
  }

  const multiplier = unit === "lb" ? KG_TO_LB : 1;

  // Pivot: week → { muscleGroup: volume }
  const allWeeks = [...new Set(data.map((d) => d.week))].sort();
  const muscleGroups = [...new Set(data.map((d) => d.muscleGroup))];

  const chartData = allWeeks.map((week) => {
    const point: Record<string, string | number> = { week };
    for (const muscle of muscleGroups) {
      const found = data.find((d) => d.week === week && d.muscleGroup === muscle);
      if (found) {
        point[muscle] = Math.round(found.volume * multiplier);
      }
    }
    return point;
  });

  const xTicks = allWeeks.filter((_, i) => i % Math.max(1, Math.ceil(allWeeks.length / 8)) === 0);

  return (
    <div style={{ width: "100%", height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
            tickFormatter={(v) => `${Number(v).toLocaleString("es")}`}
            tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const total = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
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
                  <div style={{ color: "var(--color-ink-muted)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Semana del {formatWeek(String(label ?? ""))}
                  </div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "3px" }}>
                      <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>
                        {MUSCLE_LABELS[String(p.dataKey)] ?? p.dataKey}
                      </span>
                      <span style={{ color: p.fill as string, fontSize: "12px", fontFamily: "monospace", fontWeight: 600 }}>
                        {Number(p.value).toLocaleString("es")} {unit}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-ink)", fontSize: "12px", fontWeight: 600 }}>Total</span>
                    <span style={{ color: "var(--color-ink)", fontSize: "12px", fontFamily: "monospace", fontWeight: 700 }}>
                      {total.toLocaleString("es")} {unit}
                    </span>
                  </div>
                </div>
              );
            }}
          />

          {muscleGroups.map((muscle) => (
            <Bar
              key={muscle}
              dataKey={muscle}
              stackId="volume"
              fill={MUSCLE_COLORS[muscle] ?? "var(--color-ink-muted)"}
              radius={muscle === muscleGroups[muscleGroups.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pl-11">
        {muscleGroups.map((muscle) => (
          <div key={muscle} className="flex items-center gap-1.5">
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "3px",
                background: MUSCLE_COLORS[muscle] ?? "var(--color-ink-muted)",
              }}
            />
            <span className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>
              {MUSCLE_LABELS[muscle] ?? muscle}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
