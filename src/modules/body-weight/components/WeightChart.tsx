"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { generateWeightProjection, movingAverage } from "@/utils/math";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type WeightEntry = {
  id: string;
  recordedDate: string;
  weightKg: string;
  notes: string | null;
};

type Props = {
  metrics: WeightEntry[];
  phaseStartDate: string | null;
  startingWeightKg: number | null;
  targetWeeklyChangeKg: number | null;
  unit: "kg" | "lb";
};

const KG_TO_LB = 2.20462;

function convertWeight(kg: number, unit: "kg" | "lb"): number {
  return unit === "lb" ? kg * KG_TO_LB : kg;
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr + "T12:00:00"), "d MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

type ChartPoint = {
  date: string;
  actual?: number;
  projected?: number;
  upperBand?: number;
  lowerBand?: number;
  movingAvg?: number;
  inBand?: boolean;
};

export function WeightChart({
  metrics,
  phaseStartDate,
  startingWeightKg,
  targetWeeklyChangeKg,
  unit,
}: Props) {
  if (metrics.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "200px", color: "var(--color-ink-dimmed)" }}
      >
        <span className="text-body">Sin datos suficientes para mostrar la gráfica</span>
      </div>
    );
  }

  const unitLabel = unit;

  // Build actual data points
  const actualData = metrics.map((m) => ({
    date: m.recordedDate,
    actual: convertWeight(Number(m.weightKg), unit),
  }));

  // Build moving average
  const rawForMoving = metrics.map((m) => ({
    date: new Date(m.recordedDate + "T12:00:00"),
    weightKg: Number(m.weightKg),
  }));
  const movAvg = movingAverage(rawForMoving, 4);

  // Build projection
  let projectionData: { date: string; projected: number; upperBand: number; lowerBand: number }[] = [];
  if (startingWeightKg && targetWeeklyChangeKg != null && phaseStartDate) {
    const weeksToProject = 20;
    const proj = generateWeightProjection({
      startDate: new Date(phaseStartDate + "T12:00:00"),
      startWeightKg: startingWeightKg,
      weeklyChangeKg: targetWeeklyChangeKg,
      weeksToProject,
    });
    projectionData = proj.map((p) => ({
      date: p.date.toISOString().split("T")[0],
      projected: convertWeight(p.projected, unit),
      upperBand: convertWeight(p.upperBand, unit),
      lowerBand: convertWeight(p.lowerBand, unit),
    }));
  }

  // Merge all dates into a unified sorted array
  const allDates = new Set<string>();
  actualData.forEach((d) => allDates.add(d.date));
  projectionData.forEach((d) => allDates.add(d.date));

  const sortedDates = [...allDates].sort();

  const actualMap = new Map(actualData.map((d) => [d.date, d.actual]));
  const movAvgMap = new Map(
    movAvg.map((d, i) => [rawForMoving[i]?.date.toISOString().split("T")[0], convertWeight(d.avg, unit)])
  );
  const projMap = new Map(projectionData.map((d) => [d.date, d]));

  const chartData: ChartPoint[] = sortedDates.map((date) => {
    const actual = actualMap.get(date);
    const proj = projMap.get(date);
    const movAvgVal = movAvgMap.get(date);

    const inBand =
      actual != null && proj
        ? actual >= proj.lowerBand && actual <= proj.upperBand
        : undefined;

    return {
      date,
      actual,
      projected: proj?.projected,
      upperBand: proj?.upperBand,
      lowerBand: proj?.lowerBand,
      movingAvg: movAvgVal,
      inBand,
    };
  });

  // Y-axis domain with padding
  const allVals = chartData.flatMap((d) =>
    [d.actual, d.projected, d.upperBand, d.lowerBand].filter(
      (v): v is number => v != null
    )
  );
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const padding = Math.max((maxVal - minVal) * 0.15, 1);
  const yMin = Math.floor((minVal - padding) * 10) / 10;
  const yMax = Math.ceil((maxVal + padding) * 10) / 10;

  // Determine x-axis ticks
  const xTicks = sortedDates.filter((_, i) => i % Math.ceil(sortedDates.length / 8) === 0);

  return (
    <div style={{ width: "100%", height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tickFormatter={formatDate}
            tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${Number(v).toFixed(1)}`}
            tick={{ fill: "var(--color-ink-dimmed)", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const actual = payload.find((p) => p.dataKey === "actual")?.value as number | undefined;
              const proj = payload.find((p) => p.dataKey === "projected")?.value as number | undefined;
              const mavg = payload.find((p) => p.dataKey === "movingAvg")?.value as number | undefined;
              return (
                <div
                  style={{
                    background: "var(--color-canvas-overlay)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    minWidth: "160px",
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
                    {formatDate(String(label ?? ""))}
                  </div>
                  {actual != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                      <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>Peso real</span>
                      <span style={{ color: "var(--color-ink)", fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}>
                        {actual.toFixed(1)} {unitLabel}
                      </span>
                    </div>
                  )}
                  {proj != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                      <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>Proyección</span>
                      <span style={{ color: "var(--color-primary)", fontSize: "13px", fontFamily: "monospace" }}>
                        {proj.toFixed(1)} {unitLabel}
                      </span>
                    </div>
                  )}
                  {mavg != null && actual == null && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                      <span style={{ color: "var(--color-ink-muted)", fontSize: "12px" }}>Media móvil</span>
                      <span style={{ color: "var(--color-chart-brazos)", fontSize: "13px", fontFamily: "monospace" }}>
                        {mavg.toFixed(1)} {unitLabel}
                      </span>
                    </div>
                  )}
                </div>
              );
            }}
          />

          {/* Projection band */}
          {projectionData.length > 0 && (
            <Area
              dataKey="upperBand"
              fill="var(--color-primary-subtle)"
              stroke="none"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
          {projectionData.length > 0 && (
            <Area
              dataKey="lowerBand"
              fill="var(--color-canvas-base)"
              stroke="none"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}

          {/* Projection line */}
          {projectionData.length > 0 && (
            <Line
              dataKey="projected"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
            />
          )}

          {/* Moving average */}
          {metrics.length >= 4 && (
            <Line
              dataKey="movingAvg"
              stroke="var(--color-chart-brazos)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
            />
          )}

          {/* Actual weight line */}
          <Line
            dataKey="actual"
            stroke="var(--color-ink)"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.actual == null) return <g key={`dot-${cx}-${cy}`} />;
              const inBand = payload.inBand;
              const color =
                inBand == null
                  ? "var(--color-ink)"
                  : inBand
                  ? "var(--color-success)"
                  : "var(--color-danger)";
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke="var(--color-canvas-base)"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 5, fill: "var(--color-ink)", stroke: "var(--color-canvas-base)", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />

          {/* Phase start reference line */}
          {phaseStartDate && (
            <ReferenceLine
              x={phaseStartDate}
              stroke="var(--color-border-strong)"
              strokeDasharray="4 4"
              label={{ value: "Inicio fase", fill: "var(--color-ink-dimmed)", fontSize: 10, position: "insideTopRight" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 pl-11">
        <LegendItem color="var(--color-ink)" label="Peso real" />
        {metrics.length >= 4 && <LegendItem color="var(--color-chart-brazos)" label="Media móvil 4 sem" dashed={false} />}
        {projectionData.length > 0 && <LegendItem color="var(--color-primary)" label="Proyección" dashed />}
        {projectionData.length > 0 && (
          <div className="flex items-center gap-2">
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: "var(--color-primary-subtle)",
                border: "1px solid var(--color-primary)",
              }}
            />
            <span className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>
              Banda ±30%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="2" viewBox="0 0 24 2">
        <line
          x1="0"
          y1="1"
          x2="24"
          y2="1"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "5 3" : undefined}
        />
      </svg>
      <span className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>
        {label}
      </span>
    </div>
  );
}
