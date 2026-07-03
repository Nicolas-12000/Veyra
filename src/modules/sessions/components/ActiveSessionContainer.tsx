"use client";

import { useState } from "react";
import { Timer } from "lucide-react";
import { SetLogger } from "@/src/modules/sessions/components/SetLogger";
import { FreeSessionManager } from "@/src/modules/sessions/components/FreeSessionManager";
import { CompleteSessionButton } from "@/src/modules/sessions/components/CompleteSessionButton";

interface ActiveSessionContainerProps {
  sessionId: string;
  initialUnit: "kg" | "lb";
  routineDayId?: string | null;
  routineName: string | null;
  dayLabel: string | null;
  dayOrder: number | null;
  exercises: {
    id: string;
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetRepsMin?: number | null;
    targetRepsMax?: number | null;
    restTime?: string | null;
    earlySetRpe?: string | null;
    lastSetRpe?: string | null;
    notes?: string | null;
  }[];
  mappedExistingSets: {
    id: string;
    setNumber: number;
    reps: number;
    weightKg: number;
    rpe?: number | null;
    notes?: string | null;
    exerciseId: string;
  }[];
  allExercises: {
    id: string;
    name: string;
    muscleGroup: string;
  }[];
}

export function ActiveSessionContainer({
  sessionId,
  initialUnit,
  routineDayId,
  routineName,
  dayLabel,
  dayOrder,
  exercises,
  mappedExistingSets,
  allExercises,
}: ActiveSessionContainerProps) {
  const [unit, setUnit] = useState<"kg" | "lb">(initialUnit);
  const [activeIdx, setActiveIdx] = useState(0);

  const totalExercises = exercises.length;
  const activeExercise = exercises[activeIdx];

  return (
    <div className="page-content pb-32">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display-sm" style={{ color: "var(--color-ink)" }}>
            {dayLabel ?? (dayOrder ? `Día ${dayOrder}` : "Sesión Libre")}
          </h1>
          <p className="text-caption mt-1" style={{ color: "var(--color-ink-muted)" }}>
            {routineName ?? "Sesión Libre"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Segmented Control for KG/LB */}
          <div className="flex p-0.5" style={{ background: "var(--color-canvas-overlay)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
            <button
              onClick={() => setUnit("kg")}
              className={`px-3 py-1 rounded text-[13px] font-medium transition-all ${
                unit === "kg"
                  ? "text-black shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
              style={{
                background: unit === "kg" ? "var(--color-primary)" : "transparent",
                color: unit === "kg" ? "var(--color-ink-on-primary)" : undefined,
                borderRadius: "var(--radius-sm)",
              }}
            >
              KG
            </button>
            <button
              onClick={() => setUnit("lb")}
              className={`px-3 py-1 rounded text-[13px] font-medium transition-all ${
                unit === "lb"
                  ? "text-black shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
              style={{
                background: unit === "lb" ? "var(--color-primary)" : "transparent",
                color: unit === "lb" ? "var(--color-ink-on-primary)" : undefined,
                borderRadius: "var(--radius-sm)",
              }}
            >
              LB
            </button>
          </div>

          <div className="flex items-center gap-2 text-label-caps" style={{ color: "var(--color-ink-dimmed)" }}>
            <Timer size={16} />
            <span>En curso</span>
          </div>
        </div>
      </div>

      {exercises.length > 0 ? (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between p-3" style={{ background: "var(--color-canvas-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <div className="flex items-center gap-2">
              <span className="text-caption" style={{ color: "var(--color-ink-muted)" }}>Progreso:</span>
              <span className="text-body-strong font-semibold" style={{ color: "var(--color-primary)" }}>
                {activeIdx + 1} de {totalExercises}
              </span>
            </div>
            <div className="flex-1 max-w-xs mx-4 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-canvas-overlay)" }}>
              <div 
                className="h-full transition-all duration-300"
                style={{
                  width: `${((activeIdx + 1) / totalExercises) * 100}%`,
                  background: "var(--color-primary)",
                }}
              />
            </div>
            {/* Quick dots */}
            <div className="flex gap-1.5">
              {exercises.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: i === activeIdx ? "var(--color-primary)" : "var(--color-ink-dimmed)",
                    transform: i === activeIdx ? "scale(1.1)" : undefined,
                  }}
                  aria-label={`Ir al ejercicio ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Active exercise logger */}
          <div className="card animate-fade-in" key={activeExercise.id}>
            {(() => {
              const exerciseSets = mappedExistingSets.filter(
                (s) => s.exerciseId === activeExercise.exerciseId
              );
              return (
                <SetLogger
                  sessionId={sessionId}
                  exerciseId={activeExercise.exerciseId}
                  exerciseName={activeExercise.exerciseName}
                  targetSets={activeExercise.targetSets}
                  targetRepsMin={activeExercise.targetRepsMin}
                  targetRepsMax={activeExercise.targetRepsMax}
                  restTime={activeExercise.restTime}
                  earlySetRpe={activeExercise.earlySetRpe}
                  lastSetRpe={activeExercise.lastSetRpe}
                  notes={activeExercise.notes}
                  existingSets={exerciseSets}
                  unit={unit}
                  routineDayId={routineDayId}
                />
              );
            })()}
          </div>

          {/* Navigation panel */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <button
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
              className="btn btn-secondary flex-1 py-3"
            >
              Anterior
            </button>
            <button
              onClick={() => setActiveIdx((prev) => Math.min(totalExercises - 1, prev + 1))}
              disabled={activeIdx === totalExercises - 1}
              className="btn btn-primary flex-1 py-3"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : (
        <FreeSessionManager
          sessionId={sessionId}
          existingSets={mappedExistingSets}
          allExercises={allExercises}
          unit={unit}
        />
      )}

      {/* Floating Complete Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 pointer-events-none flex justify-center z-10" style={{ background: "linear-gradient(to top, var(--color-canvas-base), transparent)" }}>
        <div className="pointer-events-auto">
          <CompleteSessionButton sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
