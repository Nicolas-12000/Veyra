"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Dumbbell, Calendar, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SessionSummaryData } from "@/src/modules/analytics/queries";
import { formatWeight } from "@/shared/utils/units";
import { deleteWorkoutSessionAction } from "@/src/modules/sessions/actions/delete-workout-session";

type Props = {
  summary: SessionSummaryData;
  unit: "kg" | "lb";
  durationMinutes: number;
};

export function SessionSummary({ summary, unit, durationMinutes }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  const handleDeleteSession = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startDeleting(async () => {
      await deleteWorkoutSessionAction({ sessionId: summary.sessionId });
    });
  };

  // Helper to format exercise volume
  const getVolumeFormatted = (volKg: number) => {
    const val = unit === "lb" ? volKg * 2.20462 : volKg;
    return `${Math.round(val).toLocaleString("es")} ${unit}`;
  };

  return (
    <div className="page-content max-w-2xl pb-32">
      {/* Visual confirmation card */}
      <div className="card text-center mb-8" style={{ border: "1px solid var(--color-border)", background: "var(--color-canvas-elevated)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "var(--color-success-subtle)", color: "var(--color-success)" }}>
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-display-md mb-2" style={{ color: "var(--color-ink)" }}>¡Entrenamiento Completado!</h1>
        <p className="text-body" style={{ color: "var(--color-ink-muted)" }}>
          Has registrado con éxito tu entrenamiento el{" "}
          {format(new Date(summary.sessionDate + "T12:00:00"), "d 'de' MMMM", { locale: es })}.
        </p>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-stat flex flex-col items-center justify-center p-4">
          <Clock className="mb-2" size={18} style={{ color: "var(--color-ink-dimmed)" }} />
          <span className="text-fine-print uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-dimmed)" }}>Duración</span>
          <span className="text-display-sm text-metric-sm" style={{ color: "var(--color-ink)" }}>{durationMinutes} min</span>
        </div>
        <div className="card-stat flex flex-col items-center justify-center p-4">
          <Dumbbell className="mb-2" size={18} style={{ color: "var(--color-ink-dimmed)" }} />
          <span className="text-fine-print uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-dimmed)" }}>Volumen</span>
          <span className="text-display-sm text-metric-sm" style={{ color: "var(--color-ink)" }}>{getVolumeFormatted(summary.totalVolume)}</span>
        </div>
        <div className="card-stat flex flex-col items-center justify-center p-4">
          <Calendar className="mb-2" size={18} style={{ color: "var(--color-ink-dimmed)" }} />
          <span className="text-fine-print uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-dimmed)" }}>Series</span>
          <span className="text-display-sm text-metric-sm" style={{ color: "var(--color-ink)" }}>{summary.totalSets}</span>
        </div>
      </div>

      {/* Exercise Performance details */}
      <div className="card space-y-6">
        <h2 className="text-display-sm pb-3" style={{ color: "var(--color-ink)", borderBottom: "1px solid var(--color-border)" }}>Detalle de Ejercicios</h2>
        
        <div className="space-y-6">
          {summary.exercises.map((ex) => {
            const bestSet = ex.sets.reduce((best, curr) => 
              (curr.weightKg * (1 + curr.reps / 30) > best.weightKg * (1 + best.reps / 30)) ? curr : best
            , ex.sets[0]);

            return (
              <div key={ex.exerciseId} className="pb-6 last:border-0 last:pb-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-body-strong" style={{ color: "var(--color-ink)" }}>{ex.exerciseName}</h3>
                    <span className="badge badge-muscle uppercase text-[9px] mt-1">{ex.muscleGroup}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-caption block" style={{ color: "var(--color-ink-muted)" }}>Mejor 1RM</span>
                    <span className="text-mono-lg font-semibold text-metric-md" style={{ color: "var(--color-ink)" }}>
                      {formatWeight(ex.estimated1rm, unit)}
                    </span>
                  </div>
                </div>

                {/* Grid stats per exercise */}
                <div className="grid grid-cols-2 gap-4 rounded-xl p-3 text-[13px]" style={{ background: "var(--color-canvas-overlay)", border: "1px solid var(--color-border)" }}>
                  <div>
                    <span className="text-caption block mb-0.5" style={{ color: "var(--color-ink-muted)" }}>Series realizadas</span>
                    <span className="text-mono text-metric-sm" style={{ color: "var(--color-ink)" }}>
                      {ex.sets.length} sets ({bestSet.weightKg}kg × {bestSet.reps} reps)
                    </span>
                  </div>
                  <div>
                    <span className="text-caption block mb-0.5" style={{ color: "var(--color-ink-muted)" }}>Volumen</span>
                    <span className="text-mono text-metric-sm" style={{ color: "var(--color-ink)" }}>{getVolumeFormatted(ex.volume)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Back to dashboard & Delete Session */}
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/dashboard" className="btn btn-primary no-underline w-full py-4 text-center rounded-xl">
          Volver al Dashboard
        </Link>
        <button
          onClick={handleDeleteSession}
          disabled={isDeleting}
          className="btn w-full py-3 text-center rounded-xl transition-all duration-200"
          style={{
            background: confirmDelete ? "var(--color-danger-subtle)" : "var(--color-canvas-overlay)",
            border: `1px solid ${confirmDelete ? "var(--color-danger)" : "var(--color-border)"}`,
            color: confirmDelete ? "var(--color-danger)" : "var(--color-ink-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          {isDeleting
            ? "Eliminando..."
            : confirmDelete
            ? "¿Seguro que quieres eliminar este entrenamiento?"
            : "Eliminar entrenamiento"}
        </button>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={isDeleting}
            className="text-caption text-center hover:underline"
            style={{ color: "var(--color-ink-muted)", border: "none", background: "none", cursor: "pointer" }}
          >
            Cancelar eliminación
          </button>
        )}
      </div>
    </div>
  );
}
