import type { PhaseHistoryEntry } from "@/src/modules/body-weight/services";
import { TrendingUp, TrendingDown, Repeat } from "lucide-react";

type Props = {
  history: PhaseHistoryEntry[];
};

const phaseConfig: Record<
  "volumen" | "definicion" | "recomposicion",
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  volumen: {
    label: "Volumen",
    color: "var(--color-success)",
    bg: "var(--color-success-subtle)",
    border: "rgba(34, 211, 160, 0.2)",
    Icon: TrendingUp,
  },
  definicion: {
    label: "Definición",
    color: "var(--color-danger)",
    bg: "var(--color-danger-subtle)",
    border: "rgba(255, 107, 107, 0.2)",
    Icon: TrendingDown,
  },
  recomposicion: {
    label: "Recomposición",
    color: "var(--color-warning)",
    bg: "var(--color-warning-subtle)",
    border: "rgba(245, 166, 35, 0.2)",
    Icon: Repeat,
  },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function PhaseHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-body" style={{ color: "var(--color-ink-muted)" }}>
          No hay historial de fases registrado aún.
        </p>
        <p className="text-caption mt-1" style={{ color: "var(--color-ink-dimmed)" }}>
          Configura tu fase de entrenamiento para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div
        className="absolute left-[19px] top-0 bottom-0 w-px"
        style={{ background: "linear-gradient(to bottom, var(--color-border), transparent)" }}
      />

      <ol className="space-y-4">
        {history.map((entry, index) => {
          const config = phaseConfig[entry.phase];
          const { Icon } = config;
          const isLatest = index === 0;

          return (
            <li key={entry.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div
                className="relative z-10 flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                }}
              >
                <Icon size={16} style={{ color: config.color }} />
              </div>

              {/* Content card */}
              <div
                className="flex-1 rounded-xl p-4 space-y-2"
                style={{
                  background: isLatest ? config.bg : "var(--color-canvas-overlay)",
                  border: `1px solid ${isLatest ? config.border : "var(--color-border)"}`,
                }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </span>
                    {isLatest && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: config.bg,
                          border: `1px solid ${config.border}`,
                          color: config.color,
                        }}
                      >
                        Actual
                      </span>
                    )}
                  </div>
                  <span className="text-caption" style={{ color: "var(--color-ink-dimmed)" }}>
                    {formatDate(entry.startDate)}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-ink-muted)" }}>
                  {entry.startingWeightKg != null && (
                    <span>
                      Peso inicial:{" "}
                      <span className="font-medium" style={{ color: "var(--color-ink)" }}>
                        {entry.startingWeightKg.toFixed(1)} kg
                      </span>
                    </span>
                  )}
                  {entry.targetWeeklyChangeKg != null && (
                    <span>
                      Cambio semanal objetivo:{" "}
                      <span className="font-medium" style={{ color: "var(--color-ink)" }}>
                        {entry.targetWeeklyChangeKg > 0 ? "+" : ""}
                        {entry.targetWeeklyChangeKg.toFixed(2)} kg
                      </span>
                    </span>
                  )}
                </div>

                {entry.note && (
                  <p className="text-caption italic mt-1" style={{ color: "var(--color-ink-muted)" }}>
                    {entry.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
