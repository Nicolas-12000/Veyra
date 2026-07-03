"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  GripVertical,
  StickyNote,
  X,
} from "lucide-react";
import { createRoutineAction } from "@/src/modules/routines/actions/create-routine";
import { addRoutineDayAction } from "@/src/modules/routines/actions/add-routine-day";
import { addRoutineExerciseAction } from "@/src/modules/routines/actions/add-routine-exercise";
import { ExercisePicker } from "./ExercisePicker";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SplitType = "push" | "pull" | "legs" | "upper" | "lower" | "full_body" | "rest";

type DayDraft = {
  dayLabel: string;
  splitType: SplitType | "";
  isRestDay: boolean;
};

type ExerciseDraft = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  targetSets: number;
  warmupSets: string;
  targetRepsMin: number;
  targetRepsMax: number;
  restTime: string;
  earlySetRpe: string;
  lastSetTechnique: string;
  notes: string;
};

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const SPLIT_OPTIONS: { value: SplitType | ""; label: string }[] = [
  { value: "", label: "Sin tipo" },
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Piernas" },
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "rest", label: "Descanso" },
];

const TECHNIQUE_OPTIONS = ["—", "Fallo", "Myo-reps", "Extender set", "Static Stretch (30s)"];

// ─── Component ─────────────────────────────────────────────────────────────────

interface CreateRoutineFormProps {
  allExercises: Exercise[];
}

export function CreateRoutineForm({ allExercises }: CreateRoutineFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<DayDraft[]>([
    { dayLabel: "", splitType: "", isRestDay: false },
  ]);
  const [exercisesByDay, setExercisesByDay] = useState<Record<number, ExerciseDraft[]>>({});
  const [pickerDayIdx, setPickerDayIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"info" | "days" | "exercises">("info");
  const [activeTabIdx, setActiveTabIdx] = useState<number | null>(null);

  // ── Day handlers ────────────────────────────────────────────────────────────

  function addDay() {
    setDays((prev) => [
      ...prev,
      { dayLabel: "", splitType: "", isRestDay: false },
    ]);
  }

  function removeDay(idx: number) {
    setDays((prev) => prev.filter((_, i) => i !== idx));
    setExercisesByDay((prev) => {
      const next: Record<number, ExerciseDraft[]> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = parseInt(key, 10);
        if (k < idx) next[k] = val;
        else if (k > idx) next[k - 1] = val;
      });
      return next;
    });
  }

  function updateDay(idx: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d))
    );
  }

  function moveDay(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= days.length) return;
    setDays((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setExercisesByDay((prev) => {
      const nextMap = { ...prev };
      const a = prev[idx];
      const b = prev[next];
      if (a) nextMap[next] = a; else delete nextMap[next];
      if (b) nextMap[idx] = b; else delete nextMap[idx];
      return nextMap;
    });
  }

  // ── Exercise handlers ───────────────────────────────────────────────────────

  function handlePickExercise(dayIdx: number, exercise: Exercise) {
    setPickerDayIdx(null);
    const draft: ExerciseDraft = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      targetSets: 3,
      warmupSets: "1-2",
      targetRepsMin: 8,
      targetRepsMax: 12,
      restTime: "2-3 min",
      earlySetRpe: "~8-9",
      lastSetTechnique: "Fallo",
      notes: "",
    };
    setExercisesByDay((prev) => ({
      ...prev,
      [dayIdx]: [...(prev[dayIdx] ?? []), draft],
    }));
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setExercisesByDay((prev) => ({
      ...prev,
      [dayIdx]: (prev[dayIdx] ?? []).filter((_, i) => i !== exIdx),
    }));
  }

  function updateExercise(dayIdx: number, exIdx: number, patch: Partial<ExerciseDraft>) {
    setExercisesByDay((prev) => ({
      ...prev,
      [dayIdx]: (prev[dayIdx] ?? []).map((ex, i) =>
        i === exIdx ? { ...ex, ...patch } : ex
      ),
    }));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la rutina es obligatorio.");
      return;
    }

    startTransition(async () => {
      // 1. Create routine
      const res = await createRoutineAction({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if ("error" in res) {
        setError("Error al crear la rutina. Intenta de nuevo.");
        return;
      }

      const routineId = res.routineId;

      // 2. Add days sequentially and collect day IDs
      const dayIds: string[] = [];
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const dayRes = await addRoutineDayAction({
          routineId,
          dayOrder: i + 1,
          dayLabel: day.dayLabel.trim() || undefined,
          splitType:
            day.splitType !== "" ? (day.splitType as SplitType) : undefined,
          isRestDay: day.isRestDay,
        });
        if ("error" in dayRes || !("routineDayId" in dayRes)) {
          setError("Error al crear los días. Intenta de nuevo.");
          return;
        }
        dayIds.push(dayRes.routineDayId);
      }

      // 3. Add exercises for each non-rest day
      for (let i = 0; i < days.length; i++) {
        const exList = exercisesByDay[i] ?? [];
        if (exList.length === 0) continue;
        for (let j = 0; j < exList.length; j++) {
          const ex = exList[j];
          await addRoutineExerciseAction({
            routineDayId: dayIds[i],
            exerciseId: ex.exerciseId,
            orderInDay: j + 1,
            targetSets: ex.targetSets,
            warmupSets: ex.warmupSets || undefined,
            targetRepsMin: ex.targetRepsMin || undefined,
            targetRepsMax: ex.targetRepsMax || undefined,
            restTime: ex.restTime || undefined,
            earlySetRpe: ex.earlySetRpe || undefined,
            lastSetTechnique: ex.lastSetTechnique || undefined,
            ...(ex.notes ? { notes: ex.notes } : {}),
          });
        }
      }

      router.push(`/routines/${routineId}`);
    });
  }

  // ── Non-rest days for step 3 ────────────────────────────────────────────────
  const trainingDays = days
    .map((d, i) => ({ ...d, idx: i }))
    .filter((d) => !d.isRestDay);

  const currentTabIdx =
    activeTabIdx !== null && trainingDays.find((d) => d.idx === activeTabIdx)
      ? activeTabIdx
      : trainingDays[0]?.idx ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      {/* ── STEP INDICATOR ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8">
        {(["info", "days", "exercises"] as const).map((s, i) => {
          const labels = ["Info", "Días", "Ejercicios"];
          const active = step === s;
          const done =
            (s === "info" && (step === "days" || step === "exercises")) ||
            (s === "days" && step === "exercises");
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  style={{
                    width: "24px",
                    height: "1px",
                    background: done ? "var(--color-primary)" : "var(--color-border-strong)",
                    transition: "background 0.3s",
                  }}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    flexShrink: 0,
                    background: done
                      ? "var(--color-primary)"
                      : active
                      ? "var(--color-primary-subtle)"
                      : "rgba(255,255,255,0.06)",
                    color: done ? "var(--color-ink-on-primary)" : active ? "var(--color-primary)" : "var(--color-ink-dimmed)",
                    border: active
                      ? "1px solid var(--color-primary)"
                      : "1px solid transparent",
                    transition: "all 0.3s",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--color-ink)" : done ? "var(--color-ink-muted)" : "var(--color-ink-dimmed)",
                    transition: "color 0.3s",
                  }}
                >
                  {labels[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: INFO ────────────────────────────────────────────────────── */}
      {step === "info" && (
        <div className="animate-fade-in">
          <div className="card mb-6">
            <h2 className="text-display-sm mb-6" style={{ color: "#F0F0F3" }}>
              Información básica
            </h2>

            <div className="mb-5">
              <label
                htmlFor="routine-name"
                className="text-label-caps mb-2 block"
                style={{ color: "#8E8EA0" }}
              >
                Nombre de la rutina *
              </label>
              <input
                id="routine-name"
                type="text"
                className="input"
                placeholder="Ej: PPL Volumen, BTS Semana 12..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="routine-desc"
                className="text-label-caps mb-2 block"
                style={{ color: "#8E8EA0" }}
              >
                Descripción{" "}
                <span style={{ color: "#52525E" }}>(opcional)</span>
              </label>
              <textarea
                id="routine-desc"
                className="input"
                style={{
                  height: "88px",
                  resize: "none",
                  paddingTop: "12px",
                  fontFamily: "var(--font-figtree)",
                  fontSize: "15px",
                }}
                placeholder="Describe el objetivo de esta rutina..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
              <div className="text-fine-print mt-1 text-right" style={{ color: "#52525E" }}>
                {description.length}/500
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-body" style={{ color: "#F87171" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/routines")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!name.trim()) {
                  setError("El nombre de la rutina es obligatorio.");
                  return;
                }
                setError(null);
                setStep("days");
              }}
            >
              Siguiente: Días →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: DAYS ────────────────────────────────────────────────────── */}
      {step === "days" && (
        <div className="animate-fade-in">
          {/* Summary banner */}
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-4"
            style={{
              background: "var(--color-primary-subtle)",
              border: "1px solid rgba(107,123,255,0.20)",
            }}
          >
            <div>
              <div className="text-body-strong" style={{ color: "var(--color-primary)" }}>
                {name}
              </div>
              {description && (
                <div className="text-caption mt-1" style={{ color: "var(--color-ink-muted)" }}>
                  {description}
                </div>
              )}
            </div>
          </div>

          {/* Days */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>
                Días de entrenamiento
              </h2>
              <div
                className="badge"
                style={{
                  background: "var(--color-canvas-overlay)",
                  color: "var(--color-ink-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {days.length} día{days.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="space-y-3">
              {days.map((day, idx) => (
                <DayRow
                  key={idx}
                  day={day}
                  index={idx}
                  total={days.length}
                  onChange={(patch) => updateDay(idx, patch)}
                  onRemove={() => removeDay(idx)}
                  onMoveUp={() => moveDay(idx, -1)}
                  onMoveDown={() => moveDay(idx, 1)}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost mt-4 w-full"
              style={{
                border: "1px dashed rgba(255,255,255,0.10)",
                borderRadius: "12px",
                height: "44px",
                color: "#8E8EA0",
              }}
              onClick={addDay}
            >
              <Plus size={16} />
              Agregar día
            </button>
          </div>

          {error && (
            <div className="mb-4 text-body" style={{ color: "#F87171" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep("info")}
            >
              ← Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setError(null);
                setStep("exercises");
              }}
            >
              Siguiente: Ejercicios →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: EXERCISES ───────────────────────────────────────────────── */}
      {step === "exercises" && (
        <div className="animate-fade-in">
          {/* Summary banner */}
          <div
            className="mb-6 p-4 rounded-xl"
            style={{
              background: "var(--color-primary-subtle)",
              border: "1px solid rgba(107,123,255,0.20)",
            }}
          >
            <div className="text-body-strong" style={{ color: "var(--color-primary)" }}>
              {name}
            </div>
            <div className="text-caption mt-1" style={{ color: "var(--color-ink-muted)" }}>
              {days.length} día{days.length !== 1 ? "s" : ""} ·{" "}
              {trainingDays.length} de entrenamiento
            </div>
          </div>

          {trainingDays.length === 0 ? (
            /* All days are rest */
            <div
              className="card text-center py-12 mb-6"
              style={{ color: "var(--color-ink-dimmed)" }}
            >
              <p className="text-body mb-1">Todos los días son de descanso.</p>
              <p className="text-caption">No hay ejercicios que configurar.</p>
            </div>
          ) : (
            <div className="card mb-6">
              <h2 className="text-display-sm mb-4" style={{ color: "var(--color-ink)" }}>
                Ejercicios por día
              </h2>

              {/* Day tabs */}
              <div
                className="flex gap-2 mb-6 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {trainingDays.map((d) => {
                  const isActive = currentTabIdx === d.idx;
                  const exCount = (exercisesByDay[d.idx] ?? []).length;
                  return (
                    <button
                      key={d.idx}
                      type="button"
                      onClick={() => setActiveTabIdx(d.idx)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all"
                      style={{
                        background: isActive ? "var(--color-canvas-elevated)" : "transparent",
                        color: isActive ? "var(--color-ink)" : "var(--color-ink-muted)",
                        border: isActive
                          ? "1px solid var(--color-border-strong)"
                          : "1px solid transparent",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.dayLabel || `Día ${d.idx + 1}`}
                      {exCount > 0 && (
                        <span
                          style={{
                            background: isActive ? "var(--color-primary-subtle)" : "rgba(255,255,255,0.08)",
                            color: isActive ? "var(--color-primary)" : "var(--color-ink-dimmed)",
                            borderRadius: "var(--radius-pill)",
                            padding: "0 6px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {exCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active day exercise list */}
              {currentTabIdx !== null && (
                <ExerciseDayPanel
                  dayIdx={currentTabIdx}
                  exercises={exercisesByDay[currentTabIdx] ?? []}
                  onAddExercise={() => setPickerDayIdx(currentTabIdx)}
                  onRemove={(exIdx) => removeExercise(currentTabIdx, exIdx)}
                  onUpdate={(exIdx, patch) =>
                    updateExercise(currentTabIdx, exIdx, patch)
                  }
                />
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 text-body" style={{ color: "#F87171" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep("days")}
            >
              ← Atrás
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || !name.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Rutina ✓"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── EXERCISE PICKER ─────────────────────────────────────────────────── */}
      {pickerDayIdx !== null && (
        <ExercisePicker
          exercises={allExercises}
          onPick={(ex) => handlePickExercise(pickerDayIdx, ex)}
          onClose={() => setPickerDayIdx(null)}
        />
      )}
    </form>
  );
}

// ─── ExerciseDayPanel ──────────────────────────────────────────────────────────

interface ExerciseDayPanelProps {
  dayIdx: number;
  exercises: ExerciseDraft[];
  onAddExercise: () => void;
  onRemove: (exIdx: number) => void;
  onUpdate: (exIdx: number, patch: Partial<ExerciseDraft>) => void;
}

function ExerciseDayPanel({
  exercises,
  onAddExercise,
  onRemove,
  onUpdate,
}: ExerciseDayPanelProps) {
  return (
    <div className="space-y-2">
      {/* Column headers — desktop only */}
      {exercises.length > 0 && (
        <div
          className="hidden md:grid mb-1 px-4"
          style={{
            gridTemplateColumns: "20px 1fr 60px 56px 72px 80px 100px 80px 36px",
            gap: "8px",
          }}
        >
          {["#", "EJERCICIO", "TRAB.", "CAL.", "REPS", "RPE EARLY", "TÉCNICA", "DESCANSO", ""].map(
            (col, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold tracking-[0.07em] uppercase"
                style={{ color: "#4A5568" }}
              >
                {col}
              </span>
            )
          )}
        </div>
      )}

      {exercises.length === 0 && (
        <div
          className="text-center py-10 rounded-[14px] text-[13px] mb-2"
          style={{
            background: "#141416",
            border: "1px dashed rgba(255,255,255,0.08)",
            color: "#4A5568",
          }}
        >
          Sin ejercicios. Agrega el primero con el botón de abajo.
        </div>
      )}

      {exercises.map((ex, idx) => (
        <DraftExerciseRow
          key={`${ex.exerciseId}-${idx}`}
          exercise={ex}
          index={idx}
          onRemove={() => onRemove(idx)}
          onUpdate={(patch) => onUpdate(idx, patch)}
        />
      ))}

      {/* Add button */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] transition-colors"
        style={{
          background: "transparent",
          border: "1px dashed rgba(255,255,255,0.10)",
          color: "#8B95A8",
          fontSize: "14px",
          fontWeight: 500,
        }}
        onClick={onAddExercise}
        id={`add-exercise-step3`}
      >
        <Plus size={15} />
        Agregar ejercicio
      </button>
    </div>
  );
}

// ─── DraftExerciseRow ──────────────────────────────────────────────────────────

interface DraftExerciseRowProps {
  exercise: ExerciseDraft;
  index: number;
  onRemove: () => void;
  onUpdate: (patch: Partial<ExerciseDraft>) => void;
}

function DraftExerciseRow({ exercise, index, onRemove, onUpdate }: DraftExerciseRowProps) {
  const [techniqueOpen, setTechniqueOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div
      className="rounded-[14px] transition-colors"
      style={{
        background: "#141416",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag handle (visual only in create flow) */}
        <GripVertical size={15} style={{ color: "#4A5568", flexShrink: 0 }} />

        {/* Index */}
        <span
          className="text-[11px] font-semibold tracking-[0.07em] flex-shrink-0 tabular-nums"
          style={{ color: "#4A5568", width: "16px" }}
        >
          {index + 1}
        </span>

        {/* Name + muscle */}
        <div className="flex-1 min-w-0">
          <span
            className="text-[15px] font-semibold leading-tight truncate block"
            style={{ color: "#FFFFFF", letterSpacing: "-0.01em" }}
          >
            {exercise.exerciseName}
          </span>
          <span className="text-[12px]" style={{ color: "#4A5568" }}>
            {exercise.muscleGroup}
          </span>
        </div>

        {/* Notes toggle */}
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className="flex-shrink-0 w-[32px] h-[32px] flex items-center justify-center rounded-[6px] transition-colors"
          style={{
            background: notesOpen || exercise.notes ? "#6B7BFF1A" : "transparent",
            color: notesOpen || exercise.notes ? "#6B7BFF" : "#4A5568",
          }}
          title="Notas"
          aria-label="Mostrar notas"
        >
          <StickyNote size={14} />
        </button>

        {/* Remove */}
        <button
          type="button"
          className="flex-shrink-0 w-[32px] h-[32px] flex items-center justify-center rounded-[6px] transition-colors"
          onClick={onRemove}
          aria-label="Eliminar ejercicio"
          style={{ color: "#FF6B6B", background: "transparent" }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Fields row */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-3"
        style={{ paddingLeft: "calc(12px + 15px + 8px + 16px + 8px)" }}
      >
        {/* Work sets */}
        <FieldChip label="Trabajo">
          <InlineNumberInput
            value={exercise.targetSets}
            onChange={(v) => onUpdate({ targetSets: v })}
            min={1}
            width="28px"
            suffix="ser"
          />
        </FieldChip>

        {/* Warmup sets */}
        <FieldChip label="Calent.">
          <InlineTextInput
            value={exercise.warmupSets}
            onChange={(v) => onUpdate({ warmupSets: v })}
            width="32px"
            placeholder="1-2"
          />
        </FieldChip>

        <Separator />

        {/* Reps */}
        <FieldChip label="Reps">
          <InlineNumberInput
            value={exercise.targetRepsMin}
            onChange={(v) => onUpdate({ targetRepsMin: v })}
            min={1}
            width="24px"
          />
          <span style={{ color: "#4A5568", fontSize: "11px" }}>–</span>
          <InlineNumberInput
            value={exercise.targetRepsMax}
            onChange={(v) => onUpdate({ targetRepsMax: v })}
            min={1}
            width="24px"
          />
        </FieldChip>

        <Separator />

        {/* Early RPE */}
        <FieldChip label="RPE early">
          <InlineTextInput
            value={exercise.earlySetRpe}
            onChange={(v) => onUpdate({ earlySetRpe: v })}
            width="44px"
            placeholder="~8-9"
          />
        </FieldChip>

        <Separator />

        {/* Last set technique */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setTechniqueOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-[6px] transition-colors"
            style={{
              background: "#22252e",
              border: "1px solid #ffffff1a",
              color:
                exercise.lastSetTechnique && exercise.lastSetTechnique !== "—"
                  ? "#8B9BFF"
                  : "#8B95A8",
              fontSize: "12px",
              fontWeight: 500,
            }}
            aria-label="Técnica último set"
          >
            <span>{exercise.lastSetTechnique || "Fallo"}</span>
            <ChevronDown size={11} style={{ color: "#4A5568" }} />
          </button>
          {techniqueOpen && (
            <div
              className="absolute z-20 mt-1 rounded-[10px] py-1 shadow-xl"
              style={{
                background: "#22252e",
                border: "1px solid #ffffff1a",
                minWidth: "160px",
                top: "100%",
                left: 0,
              }}
            >
              {TECHNIQUE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onUpdate({ lastSetTechnique: opt });
                    setTechniqueOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] transition-colors"
                  style={{
                    color:
                      exercise.lastSetTechnique === opt ? "#6B7BFF" : "#FFFFFF",
                    background:
                      exercise.lastSetTechnique === opt
                        ? "#6B7BFF1A"
                        : "transparent",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Rest time */}
        <FieldChip label="Descanso">
          <span style={{ fontSize: "11px", color: "#4A5568" }}>⏱</span>
          <InlineTextInput
            value={exercise.restTime}
            onChange={(v) => onUpdate({ restTime: v })}
            width="52px"
            placeholder="2-3 min"
          />
        </FieldChip>
      </div>

      {/* Notes panel */}
      {notesOpen && (
        <div
          className="px-3 pb-3 pt-0"
          style={{ paddingLeft: "calc(12px + 15px + 8px + 16px + 8px)" }}
        >
          <div
            className="rounded-[10px] overflow-hidden"
            style={{
              background: "#22252e",
              border: "1px solid #ffffff1a",
            }}
          >
            <textarea
              value={exercise.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Cues técnicos, sustituciones, observaciones…"
              rows={3}
              className="w-full bg-transparent px-3 py-2 text-[13px] resize-none focus:outline-none leading-relaxed"
              style={{
                color: "#FFFFFF",
                caretColor: "#6B7BFF",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Day row (step 2) ──────────────────────────────────────────────────────────

function DayRow({
  day,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  day: DayDraft;
  index: number;
  total: number;
  onChange: (patch: Partial<DayDraft>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--color-canvas-overlay)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Order controls */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            className="btn-icon cursor-pointer"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "var(--radius-xs)",
              opacity: index === 0 ? 0.3 : 1,
            }}
            onClick={onMoveUp}
            disabled={index === 0}
            title="Mover arriba"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            className="btn-icon cursor-pointer"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "var(--radius-xs)",
              opacity: index === total - 1 ? 0.3 : 1,
            }}
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Mover abajo"
          >
            <ChevronDown size={12} />
          </button>
        </div>

        <div
          className="text-label-caps flex-shrink-0"
          style={{ color: "var(--color-ink-dimmed)", width: "40px" }}
        >
          Día {index + 1}
        </div>

        <input
          type="text"
          className="input"
          style={{ height: "40px", flex: 1, fontSize: "14px" }}
          placeholder={`Nombre (ej: Push - Fuerza)`}
          value={day.dayLabel}
          onChange={(e) => onChange({ dayLabel: e.target.value })}
          maxLength={120}
        />

        <button
          type="button"
          className="btn-icon flex-shrink-0 cursor-pointer"
          onClick={onRemove}
          title="Eliminar día"
          style={{ color: "var(--color-danger)" }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3 pl-[40px]">
        <select
          className="input"
          style={{
            height: "36px",
            fontSize: "13px",
            flex: 1,
          }}
          value={day.splitType}
          onChange={(e) =>
            onChange({ splitType: e.target.value as SplitType | "" })
          }
        >
          {SPLIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label
          className="flex items-center gap-2 text-label cursor-pointer"
          style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}
        >
          <input
            type="checkbox"
            checked={day.isRestDay}
            onChange={(e) => {
              onChange({
                isRestDay: e.target.checked,
                splitType: e.target.checked ? "rest" : "",
              });
            }}
            style={{ accentColor: "var(--color-primary)" }}
          />
          Descanso
        </label>
      </div>
    </div>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────────

function FieldChip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-semibold tracking-[0.07em] uppercase"
        style={{ color: "#4A5568" }}
      >
        {label}
      </span>
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-[6px]"
        style={{
          background: "#22252e",
          border: "1px solid #ffffff1a",
          minHeight: "28px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InlineNumberInput({
  value,
  onChange,
  width,
  min,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  width: string;
  min?: number;
  suffix?: string;
}) {
  return (
    <>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(n);
        }}
        style={{
          width,
          background: "transparent",
          color: "#FFFFFF",
          fontSize: "13px",
          fontWeight: 500,
          textAlign: "center",
          fontFeatureSettings: '"tnum"',
          outline: "none",
          border: "none",
          padding: 0,
        }}
        min={min}
      />
      {suffix && (
        <span style={{ fontSize: "11px", color: "#4A5568" }}>{suffix}</span>
      )}
    </>
  );
}

function InlineTextInput({
  value,
  onChange,
  width,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  width: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width,
        background: "transparent",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 500,
        textAlign: "center",
        outline: "none",
        border: "none",
        padding: 0,
      }}
      placeholder={placeholder}
    />
  );
}

function Separator() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "#ffffff0f",
        flexShrink: 0,
        alignSelf: "flex-end",
        marginBottom: "4px",
      }}
    />
  );
}
