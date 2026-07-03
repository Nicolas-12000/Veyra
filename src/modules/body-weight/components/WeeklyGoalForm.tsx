"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { updatePhase } from "@/src/modules/body-weight/actions/update-phase";

type Phase = "volumen" | "definicion" | "recomposicion";

const PHASE_CONFIG = {
  volumen: {
    label: "Volumen",
    description: "Objetivo: ganar músculo con un superávit calórico controlado",
    icon: TrendingUp,
    color: "var(--color-success)",
    colorSubtle: "var(--color-success-subtle)",
    defaultChange: 0.25,
    min: 0.1,
    max: 0.7,
    step: 0.05,
    sign: "+",
    hint: "Recomendado: +0.15 a +0.35 kg/semana",
  },
  definicion: {
    label: "Definición",
    description: "Objetivo: perder grasa preservando la masa muscular",
    icon: TrendingDown,
    color: "var(--color-danger)",
    colorSubtle: "var(--color-danger-subtle)",
    defaultChange: -0.5,
    min: -1.0,
    max: -0.1,
    step: 0.05,
    sign: "-",
    hint: "Recomendado: -0.25 a -0.75 kg/semana",
  },
  recomposicion: {
    label: "Recomposición",
    description: "Objetivo: mantener peso mientras cambia la composición corporal",
    icon: Minus,
    color: "var(--color-warning)",
    colorSubtle: "var(--color-warning-subtle)",
    defaultChange: 0.0,
    min: -0.2,
    max: 0.2,
    step: 0.05,
    sign: "±",
    hint: "Recomendado: 0 ± 0.1 kg/semana",
  },
};

export function WeeklyGoalForm({
  currentPhase,
  currentWeeklyChange,
}: {
  currentPhase: Phase | null;
  currentWeeklyChange: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>(currentPhase ?? "volumen");
  const [weeklyChange, setWeeklyChange] = useState<number>(
    currentWeeklyChange ?? PHASE_CONFIG[currentPhase ?? "volumen"].defaultChange
  );
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  function handlePhaseChange(newPhase: Phase) {
    setPhase(newPhase);
    setWeeklyChange(PHASE_CONFIG[newPhase].defaultChange);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updatePhase({
        phase,
        weeklyChangeKg: weeklyChange,
      });

      if ("error" in res) {
        setError("Error al guardar. Intenta de nuevo.");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Phase selector */}
      <div className="mb-6">
        <label className="text-label-caps block mb-3" style={{ color: "var(--color-ink-muted)" }}>
          Fase de entrenamiento
        </label>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {(Object.keys(PHASE_CONFIG) as Phase[]).map((p) => {
            const cfg = PHASE_CONFIG[p];
            const PhaseIcon = cfg.icon;
            const isActive = phase === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePhaseChange(p)}
                className="phase-selector-card cursor-pointer"
                style={{
                  textAlign: "left",
                  border: isActive
                    ? `1px solid ${cfg.color}`
                    : "1px solid var(--color-border)",
                  background: isActive ? cfg.colorSubtle : "var(--color-canvas-overlay)",
                  transition: "all 120ms ease",
                }}
              >
                <PhaseIcon
                  size={18}
                  style={{
                    color: isActive ? cfg.color : "var(--color-ink-dimmed)",
                    marginBottom: "8px",
                  }}
                />
                <div
                  className="text-body-strong"
                  style={{ color: isActive ? cfg.color : "var(--color-ink)" }}
                >
                  {cfg.label}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-caption mt-3" style={{ color: "var(--color-ink-dimmed)" }}>
          {config.description}
        </p>
      </div>

      {/* Weekly change slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-label-caps" style={{ color: "var(--color-ink-muted)" }}>
            Ritmo semanal objetivo
          </label>
          <div className="flex items-center gap-1">
            <Icon size={14} style={{ color: config.color }} />
            <span
              className="text-mono-lg text-metric-sm font-semibold"
              style={{ color: config.color }}
            >
              {weeklyChange >= 0 ? "+" : ""}
              {weeklyChange.toFixed(2)} kg/sem
            </span>
          </div>
        </div>

        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={weeklyChange}
          onChange={(e) => setWeeklyChange(parseFloat(e.target.value))}
          style={{
            width: "100%",
            accentColor: config.color,
            height: "6px",
          }}
        />

        <div
          className="flex justify-between text-fine-print mt-1"
          style={{ color: "var(--color-ink-dimmed)" }}
        >
          <span>{config.min >= 0 ? `+${config.min}` : config.min} kg</span>
          <span>{config.hint}</span>
          <span>{config.max >= 0 ? `+${config.max}` : config.max} kg</span>
        </div>
      </div>

      {/* Projection preview */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{
          background: "var(--color-canvas-overlay)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="text-label-caps mb-3" style={{ color: "var(--color-ink-dimmed)" }}>
          Proyección estimada
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[4, 12, 24].map((weeks) => {
            const change = weeklyChange * weeks;
            const positive = change >= 0;
            return (
              <div key={weeks} style={{ textAlign: "center" }}>
                <div className="text-label-caps mb-1" style={{ color: "var(--color-ink-dimmed)" }}>
                  {weeks} sem
                </div>
                <div
                  className="text-mono text-metric-sm font-semibold"
                  style={{ color: positive ? "var(--color-success)" : "var(--color-danger)" }}
                >
                  {positive ? "+" : ""}
                  {change.toFixed(1)} kg
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-body" style={{ color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {success && (
        <div
          className="mb-4 flex items-center gap-2 text-body"
          style={{ color: "var(--color-success)" }}
        >
          <CheckCircle2 size={16} />
          Objetivo guardado correctamente
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar objetivo"
        )}
      </button>
    </form>
  );
}
