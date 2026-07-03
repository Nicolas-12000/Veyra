"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RPEScatterPoint } from "@/src/modules/analytics/queries";

type Props = {
  data: RPEScatterPoint[];
  unit: "kg" | "lb";
};

const KG_TO_LB = 2.20462;

function getRpeColor(rpe: number | null): string {
  if (rpe == null) return "var(--color-ink-dimmed)";
  if (rpe >= 9.5) return "var(--color-danger)"; // red
  if (rpe >= 8.5) return "var(--color-warning)"; // orange
  if (rpe >= 7.5) return "#FBBF24"; // yellow (warm)
  if (rpe >= 6.5) return "var(--color-success)"; // green
  return "var(--color-primary-on-dark)"; // blue/indigo (low RPE)
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr + "T12:00:00"), "d MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export function RPEScatterChart({ data, unit }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: "240px", color: "var(--color-ink-dimmed)" }}>
        <span className="text-body">Sin datos para el período seleccionado</span>
      </div>
    );
  }

  const multiplier = unit === "lb" ? KG_TO_LB : 1;

  // Build per-session best 1RM trend line
  const sessionMap = new Map<string, number>();
  for (const d of data) {
    const e1rm = d.estimated1rm * multiplier;
    if (!sessionMap.has(d.date) || sessionMap.get(d.date)! < e1rm) {
      sessionMap.set(d.date, e1rm);
    }
  }

  const sortedDates = [...new Set(data.map((d) => d.date))].sort();
  const dateIndex = new Map(sortedDates.map((d, i) => [d, i]));

  const scatterPoints = data.map((d) => ({
    x: dateIndex.get(d.date) ?? 0,
    y: d.weightKg * multiplier,
    rpe: d.rpe,
    reps: d.reps,
    date: d.date,
    estimated1rm: d.estimated1rm * multiplier,
    color: getRpeColor(d.rpe),
    r: Math.max(3, Math.min(8, 2 + d.reps * 0.4)),
  }));

  const chartData = sortedDates.map((date, i) => {
    const result: Record<string, unknown> = {
      x: i,
      date,
      trend: (sessionMap.get(date) ?? 0),
    };
    return result;
  });

  const allY = scatterPoints.map((p) => p.y);
  const minY = allY.length ? Math.min(...allY) : 0;
  const maxY = allY.length ? Math.max(...allY) : 100;
  const padding = Math.max((maxY - minY) * 0.2, 5);

  return (
    <div>
      <div style={{ width: "100%", height: "280px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={[-0.5, sortedDates.length - 0.5]}
              ticks={sortedDates.map((_, i) => i).filter((i) => i % Math.max(1, Math.ceil(sortedDates.length / 8)) === 0)}
              tickFormatter={(v) => formatDate(sortedDates[v] ?? "")}
              tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[Math.floor(minY - padding), Math.ceil(maxY + padding)]}
              tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div style={{ background: "var(--color-canvas-overlay)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
                    <div style={{ color: "var(--color-ink-muted)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                      {formatDate(d.date ?? "")}
                    </div>
                    {d.y != null && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                        <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>Carga</span>
                        <span style={{ color: "var(--color-ink)", fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}>
                          {Number(d.y).toFixed(1)} {unit}
                        </span>
                      </div>
                    )}
                    {d.reps != null && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                        <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>Reps</span>
                        <span style={{ color: "var(--color-ink)", fontSize: "13px", fontFamily: "monospace" }}>{d.reps}</span>
                      </div>
                    )}
                    {d.rpe != null && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                        <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>RPE</span>
                        <span style={{ color: getRpeColor(d.rpe), fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}>{d.rpe}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Trend line for 1RM */}
            <Line
              data={chartData}
              dataKey="trend"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={false}
              connectNulls
              type="monotone"
              legendType="none"
              isAnimationActive={false}
            />

            {/* Scatter points */}
            <Scatter
              data={scatterPoints}
              dataKey="y"
              shape={(props: { cx?: number; cy?: number; payload?: { r?: number; color?: string; date?: string; y?: number; reps?: number; rpe?: number | null } }) => {
                const { cx = 0, cy = 0, payload = {} } = props;
                const r = payload.r ?? 4;
                const color = payload.color ?? "var(--color-ink-dimmed)";
                return (
                  <circle
                    key={`scatter-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="var(--color-canvas-base)"
                    strokeWidth={1.5}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RPE Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pl-11">
        {[
          { label: "RPE 6–7", color: "var(--color-primary-on-dark)" },
          { label: "RPE 7.5", color: "var(--color-success)" },
          { label: "RPE 8", color: "#FBBF24" },
          { label: "RPE 8.5–9", color: "var(--color-warning)" },
          { label: "RPE 9.5–10", color: "var(--color-danger)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
            <span className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <svg width="16" height="2" viewBox="0 0 16 2">
            <line x1="0" y1="1" x2="16" y2="1" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <span className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>1RM tendencia</span>
        </div>
      </div>
    </div>
  );
}
