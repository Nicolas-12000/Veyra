import { useOptimistic, useRef, useState, useTransition, useEffect } from "react";
import { logSet } from "@/src/modules/sessions/actions/log-set";
import { deleteSetAction } from "@/src/modules/sessions/actions/delete-set";
import { CheckCircle2, Circle, Loader2, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { toKg, toLbs } from "@/shared/utils/units";
import { getExerciseHistoryAction } from "@/src/modules/sessions/actions/get-exercise-history";

export interface SetLog {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number | null;
  notes?: string | null;
  pending?: boolean;
}

interface SetLoggerProps {
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  existingSets: SetLog[];
  targetSets: number;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  restTime?: string | null;
  earlySetRpe?: string | null;
  lastSetRpe?: string | null;
  notes?: string | null;
  unit: "kg" | "lb";
  routineDayId?: string | null;
}

type OptimisticAction =
  | { type: "add"; set: SetLog }
  | { type: "confirm"; tempId: string; realSet: SetLog }
  | { type: "delete"; setId: string };

function setsReducer(state: SetLog[], action: OptimisticAction): SetLog[] {
  if (action.type === "add") {
    return [...state, action.set];
  }
  if (action.type === "confirm") {
    return state.map((s) =>
      s.id === action.tempId ? { ...action.realSet, pending: false } : s
    );
  }
  if (action.type === "delete") {
    return state.filter((s) => s.id !== action.setId);
  }
  return state;
}

const RPE_PRESETS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export function SetLogger({
  sessionId,
  exerciseId,
  exerciseName,
  existingSets,
  targetSets,
  targetRepsMin,
  targetRepsMax,
  restTime,
  earlySetRpe,
  lastSetRpe,
  notes,
  unit,
  routineDayId,
}: SetLoggerProps) {
  const lastSet = existingSets[existingSets.length - 1];

  const [weight, setWeight] = useState(() => {
    if (lastSet) {
      return unit === "lb"
        ? String(toLbs(lastSet.weightKg))
        : String(lastSet.weightKg);
    }
    return "";
  });
  const [reps, setReps] = useState(
    lastSet ? String(lastSet.reps) : targetRepsMin ? String(targetRepsMin) : ""
  );
  const [rpe, setRpe] = useState<number | null>(null);

  const [optimisticSets, addOptimisticSet] = useOptimistic<SetLog[], OptimisticAction>(
    existingSets,
    setsReducer
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteSetId, setConfirmDeleteSetId] = useState<string | null>(null);

  const [history, setHistory] = useState<{ id: string; setNumber: number; reps: number; weightKg: number; rpe: number | null }[]>([]);
  const [historyIsFromSameDay, setHistoryIsFromSameDay] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const prevUnitRef = useRef(unit);

  // Load exercise history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await getExerciseHistoryAction({
          exerciseId,
          routineDayId,
        });
        if (res && res.sets) {
          setHistory(res.sets as any);
          setHistoryIsFromSameDay(res.isFromSameDay);

          // If no sets registered in current session, prefill with history
          if (existingSets.length === 0 && res.sets.length > 0) {
            const firstSet = res.sets[0];
            const convertedWeight = unit === "lb" ? toLbs(firstSet.weightKg) : firstSet.weightKg;
            setWeight(String(convertedWeight));
            setReps(String(firstSet.reps));
          }
        }
      } catch (err) {
        console.error("Error loading exercise history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [exerciseId, routineDayId]);

  // Live unit conversion
  useEffect(() => {
    if (prevUnitRef.current !== unit) {
      const weightNum = parseFloat(weight);
      if (!isNaN(weightNum) && weightNum > 0) {
        if (unit === "lb") {
          setWeight(String(toLbs(weightNum)));
        } else {
          setWeight(String(toKg(weightNum)));
        }
      }
      prevUnitRef.current = unit;
    }
  }, [unit, weight]);

  const nextSetNumber = optimisticSets.length + 1;
  const isLastSet = nextSetNumber >= targetSets;

  function handleLogSet() {
    if (optimisticSets.length >= targetSets) {
      setError("Ya has completado todas las series establecidas");
      return;
    }

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);

    if (!weightNum || !repsNum || weightNum <= 0 || repsNum <= 0) {
      setError("Ingresa carga y repeticiones válidas");
      return;
    }
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const weightKg = unit === "lb" ? toKg(weightNum) : weightNum;

    const optimisticSet: SetLog = {
      id: tempId,
      setNumber: nextSetNumber,
      reps: repsNum,
      weightKg,
      rpe: rpe ?? undefined,
      pending: true,
    };

    startTransition(async () => {
      addOptimisticSet({ type: "add", set: optimisticSet });

      const result = await logSet({
        sessionId,
        exerciseId,
        setNumber: nextSetNumber,
        reps: repsNum,
        weight: weightNum,
        unit,
        rpe: rpe ?? undefined,
        isLastSet,
      });

      if (result && "error" in result) {
        setError("Error al guardar el set. Intenta de nuevo.");
      }
    });

    setRpe(null);
  }

  function handleDeleteSet(setId: string) {
    setError(null);
    startTransition(async () => {
      addOptimisticSet({ type: "delete", setId });
      setConfirmDeleteSetId(null);
      const res = await deleteSetAction({ setId, sessionId });
      if (res && "error" in res) {
        setError("Error al eliminar el set.");
      }
    });
  }

  function adjustWeight(delta: number) {
    const current = parseFloat(weight) || 0;
    const step = unit === "lb" ? 2.5 : 0.5;
    const next = Math.max(0, Math.round((current + delta * step) * 10) / 10);
    setWeight(String(next));
  }

  function adjustReps(delta: number) {
    const current = parseInt(reps, 10) || 0;
    const next = Math.max(1, current + delta);
    setReps(String(next));
  }

  const restLabel = restTime ?? "2 min";

  return (
    <div>
      {/* Exercise header */}
      <div className="mb-6">
        <div className="text-display-sm mb-1" style={{ color: "var(--color-ink)" }}>
          {exerciseName}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
            Objetivo: {targetSets} series
            {targetRepsMin && ` · ${targetRepsMin}${targetRepsMax && targetRepsMax !== targetRepsMin ? `–${targetRepsMax}` : ""} reps`}
            {` · Descanso ${restLabel}`}
          </span>
        </div>
        {notes && (
          <div
            className="mt-2 px-3 py-2 text-caption"
            style={{
              background: "var(--color-primary-subtle)",
              color: "var(--color-ink-muted)",
              borderLeft: "2px solid var(--color-primary)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            💡 {notes}
          </div>
        )}
        
        {/* Previous session reference */}
        {history.length > 0 && (
          <div
            className="mt-3 p-3 border text-caption"
            style={{
              background: "var(--color-canvas-overlay)",
              borderColor: "var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div className="flex items-center justify-between mb-2 font-medium text-[11px] uppercase tracking-wider" style={{ color: "var(--color-ink-muted)" }}>
              <span>Sesión anterior ({historyIsFromSameDay ? "mismo día" : "historial"})</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {history.map((hSet) => {
                const w = unit === "lb" ? toLbs(hSet.weightKg) : hSet.weightKg;
                return (
                  <span
                    key={hSet.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[12px]"
                    style={{ background: "var(--color-canvas-elevated)", color: "var(--color-ink)" }}
                  >
                    S{hSet.setNumber}: {w} {unit} × {hSet.reps} r
                    {hSet.rpe ? ` @ RPE ${hSet.rpe}` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {optimisticSets.length >= targetSets ? (
        <div 
          className="card-elevated mb-6 text-center py-6 animate-fade-in" 
          style={{ background: "var(--color-success-subtle)", borderColor: "rgba(34, 211, 160, 0.2)" }}
        >
          <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: "var(--color-success)" }} />
          <div className="text-display-sm" style={{ color: "var(--color-ink)" }}>¡Objetivo alcanzado!</div>
          <p className="text-caption mt-1" style={{ color: "var(--color-ink-muted)" }}>
            Has completado las {targetSets} series establecidas para este ejercicio.
          </p>
        </div>
      ) : (
        <div className="card-elevated mb-6">
          <div className="text-label-caps mb-4" style={{ color: "var(--color-ink-muted)" }}>
            Set {nextSetNumber}
            {nextSetNumber <= targetSets && (
              <span className="ml-2" style={{ color: "var(--color-primary)" }}>
                ({nextSetNumber}/{targetSets})
              </span>
            )}
          </div>

          {/* Weight + Reps inputs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Weight */}
            <div>
              <label className="text-label mb-2 block" style={{ color: "var(--color-ink-muted)" }}>
                Carga ({unit})
              </label>
              <div className="gym-input-group">
                <button
                  onClick={() => adjustWeight(-1)}
                  className="btn-icon"
                  aria-label="Reducir carga"
                >
                  <ChevronDown size={16} />
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="input-number-gym flex-1"
                  style={{ minWidth: 0 }}
                />
                <button
                  onClick={() => adjustWeight(1)}
                  className="btn-icon"
                  aria-label="Aumentar carga"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
            </div>

            {/* Reps */}
            <div>
              <label className="text-label mb-2 block" style={{ color: "var(--color-ink-muted)" }}>
                Repeticiones
              </label>
              <div className="gym-input-group">
                <button
                  onClick={() => adjustReps(-1)}
                  className="btn-icon"
                  aria-label="Reducir reps"
                >
                  <ChevronDown size={16} />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="0"
                  className="input-number-gym flex-1"
                  style={{ minWidth: 0 }}
                />
                <button
                  onClick={() => adjustReps(1)}
                  className="btn-icon"
                  aria-label="Aumentar reps"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* RPE Selector */}
          <div className="mb-4">
            <label className="text-label mb-2 block" style={{ color: "var(--color-ink-muted)" }}>
              RPE {rpe !== null ? `— ${rpe}` : "(opcional)"}
            </label>
            <div className="flex gap-1 flex-wrap">
              {RPE_PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setRpe(rpe === v ? null : v)}
                  className="quick-rest-btn"
                  style={{
                    background: rpe === v ? "var(--color-primary-subtle)" : undefined,
                    color: rpe === v ? "var(--color-primary)" : undefined,
                    border: rpe === v ? "1px solid var(--color-primary)" : "none",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-caption" style={{ color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          {/* Log Set Button */}
          <button
            onClick={handleLogSet}
            disabled={isPending}
            className="btn btn-primary w-full"
            style={{ fontSize: "16px" }}
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {isPending ? "Guardando..." : `+ Registrar Set ${nextSetNumber}`}
          </button>
        </div>
      )}

      {/* Previous sets */}
      {optimisticSets.length > 0 && (
        <div>
          <div className="text-label-caps mb-3" style={{ color: "var(--color-ink-dimmed)" }}>
            Sets registrados
          </div>
          <div>
            {optimisticSets.map((set) => (
              <div
                key={set.id}
                className={`set-log-row ${set.pending ? "set-log-row-pending" : "set-log-row-confirmed"}`}
              >
                <div style={{ minWidth: "40px" }}>
                  {set.pending ? (
                    <span className="animate-pulse-dot" style={{ color: "var(--color-ink-dimmed)" }}>
                      <Circle size={14} />
                    </span>
                  ) : (
                    <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />
                  )}
                </div>
                <div style={{ minWidth: "32px", color: "var(--color-ink-dimmed)" }}>
                  {set.setNumber}
                </div>
                <div className="flex-1">
                  <span style={{ color: set.pending ? "var(--color-ink-dimmed)" : "var(--color-ink)" }}>
                    {unit === "lb"
                      ? toLbs(set.weightKg)
                      : set.weightKg.toFixed(1)}{" "}
                    {unit}
                  </span>
                  <span style={{ color: "var(--color-ink-dimmed)", margin: "0 8px" }}>×</span>
                  <span style={{ color: set.pending ? "var(--color-ink-dimmed)" : "var(--color-ink)" }}>
                    {set.reps} reps
                  </span>
                  {set.rpe && (
                    <span
                      className="ml-2 text-caption"
                      style={{ color: "var(--color-ink-muted)" }}
                    >
                      RPE {set.rpe}
                    </span>
                  )}
                </div>
                {set.pending ? (
                  <div className="text-fine-print" style={{ color: "var(--color-ink-dimmed)" }}>
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {confirmDeleteSetId === set.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeleteSet(set.id)}
                          disabled={isPending}
                          className="text-[11px] px-2 py-1 rounded font-medium transition-colors"
                          style={{
                            background: "var(--color-danger-subtle)",
                            border: "1px solid var(--color-danger)",
                            color: "var(--color-danger)",
                            cursor: "pointer",
                          }}
                        >
                          Confirmar?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSetId(null)}
                          disabled={isPending}
                          className="text-[11px] px-2 py-1 rounded transition-colors"
                          style={{
                            background: "var(--color-canvas-overlay)",
                            border: "1px solid var(--color-border-strong)",
                            color: "var(--color-ink-muted)",
                            cursor: "pointer",
                          }}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSetId(set.id)}
                        disabled={isPending}
                        className="btn-icon"
                        style={{ padding: "4px", color: "var(--color-ink-dimmed)", cursor: "pointer" }}
                        title="Eliminar serie"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
