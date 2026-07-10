"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, GripVertical, ChevronDown, StickyNote, X } from "lucide-react";
import { addRoutineExerciseAction } from "@/src/modules/routines/actions/add-routine-exercise";
import { removeRoutineExerciseAction } from "@/src/modules/routines/actions/remove-routine-exercise";
import { updateRoutineExerciseAction } from "@/src/modules/routines/actions/update-routine-exercise";
import { ExercisePicker } from "./ExercisePicker";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

type RoutineExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  orderInDay: number;
  targetSets: number;
  warmupSets: string | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  restTime: string | null;
  earlySetRpe: string | null;
  lastSetRpe: string | null;
  lastSetTechnique: string | null;
  notes: string | null;
};

type RoutineDay = {
  id: string;
  dayOrder: number;
  dayLabel: string | null;
  splitType: string | null;
  isRestDay: boolean | null;
  exercises: RoutineExercise[];
};

const SPLIT_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Piernas",
  upper: "Upper",
  lower: "Lower",
  full_body: "Full Body",
  rest: "Descanso",
};

const TECHNIQUE_OPTIONS = ["—", "Fallo", "Myo-reps", "Extender set", "Static Stretch (30s)"];

interface RoutineEditorProps {
  routineId: string;
  days: RoutineDay[];
  allExercises: Exercise[];
}

export function RoutineEditor({ routineId, days, allExercises }: RoutineEditorProps) {
  const [activeDay, setActiveDay] = useState(days[0]?.id ?? null);
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [localDays, setLocalDays] = useState<RoutineDay[]>(days);
  const [removePending, startRemove] = useTransition();
  const [addPending, startAdd] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentDay = localDays.find((d) => d.id === activeDay) ?? null;

  function handlePickExercise(dayId: string, exercise: Exercise) {
    setPickerDayId(null);
    setError(null);

    const day = localDays.find((d) => d.id === dayId);
    if (!day) return;
    const orderInDay = day.exercises.length + 1;

    startAdd(async () => {
      const result = await addRoutineExerciseAction({
        routineDayId: dayId,
        exerciseId: exercise.id,
        orderInDay,
        targetSets: 3,
        warmupSets: "1-2",
        targetRepsMin: 8,
        targetRepsMax: 12,
        restTime: "2-3 min",
        earlySetRpe: "~8-9",
        lastSetTechnique: "Fallo",
      });

      if ("error" in result) {
        setError("Error al agregar ejercicio. Intenta de nuevo.");
        return;
      }

      setLocalDays((prev) =>
        prev.map((d) =>
          d.id !== dayId
            ? d
            : {
                ...d,
                exercises: [
                  ...d.exercises,
                  {
                    id: result.routineExerciseId,
                    exerciseId: exercise.id,
                    exerciseName: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    orderInDay,
                    targetSets: 3,
                    warmupSets: "1-2",
                    targetRepsMin: 8,
                    targetRepsMax: 12,
                    restTime: "2-3 min",
                    earlySetRpe: "~8-9",
                    lastSetRpe: null,
                    lastSetTechnique: "Fallo",
                    notes: null,
                  },
                ],
              }
        )
      );
    });
  }

  function handleRemoveExercise(exerciseId: string) {
    if (!confirm("¿Quitar este ejercicio del día?")) return;
    setError(null);

    setLocalDays((prev) =>
      prev.map((d) => ({
        ...d,
        exercises: d.exercises.filter((ex) => ex.id !== exerciseId),
      }))
    );

    startRemove(async () => {
      const result = await removeRoutineExerciseAction({ routineExerciseId: exerciseId });
      if ("error" in result) {
        setError("Error al eliminar ejercicio.");
      }
    });
  }

  function handleUpdateExercise(exerciseId: string, updatedFields: Partial<RoutineExercise>) {
    setLocalDays((prev) =>
      prev.map((d) => ({
        ...d,
        exercises: d.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, ...updatedFields } : ex
        ),
      }))
    );
  }

  return (
    <div>
      {/* Day tabs - scrollable horizontal strip */}
      <div
        className="flex gap-1.5 mb-6 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {localDays.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDay(day.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-[10px] font-medium transition-all"
            style={{
              fontSize: "12px",
              background: activeDay === day.id ? "#1a1c24" : "transparent",
              color: activeDay === day.id ? "#FFFFFF" : "#4A5568",
              border: activeDay === day.id
                ? "1px solid #ffffff1a"
                : "1px solid transparent",
              whiteSpace: "nowrap",
              lineHeight: "1.4",
            }}
            id={`day-tab-${day.id}`}
          >
            {day.dayLabel ?? `Día ${day.dayOrder}`}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 text-[13px]" style={{ color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {currentDay && (
        <div>
          {currentDay.isRestDay ? (
            <div
              className="text-center py-10 rounded-[14px]"
              style={{ background: "var(--color-canvas-overlay)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-[15px]" style={{ color: "var(--color-ink-dimmed)" }}>
                Día de descanso
              </p>
            </div>
          ) : (
            <div>
              {/* Column header */}
              {currentDay.exercises.length > 0 && (
                <div
                  className="hidden md:grid mb-1 px-4"
                  style={{
                    gridTemplateColumns: "20px 1fr 56px 56px 72px 72px 100px 80px 36px 36px",
                    gap: "8px",
                  }}
                >
                  {["#", "EJERCICIO", "TRAB.", "CAL.", "REPS", "RPE EARLY", "TÉCNICA", "DESCANSO", "", ""].map(
                    (col, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold tracking-[0.07em] uppercase"
                        style={{ color: "var(--color-ink-dimmed)" }}
                      >
                        {col}
                      </span>
                    )
                  )}
                </div>
              )}

              <div className="space-y-2">
                {currentDay.exercises.length === 0 && (
                  <div
                    className="text-center py-10 rounded-[14px] text-[13px]"
                    style={{
                      background: "var(--color-canvas-overlay)",
                      border: "1px dashed var(--color-border)",
                      color: "var(--color-ink-dimmed)",
                    }}
                  >
                    Sin ejercicios. Agrega el primero.
                  </div>
                )}

                {currentDay.exercises.map((ex, idx) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    index={idx}
                    onRemove={() => handleRemoveExercise(ex.id)}
                    removePending={removePending}
                    onUpdate={handleUpdateExercise}
                  />
                ))}

                {/* Add exercise button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] transition-colors"
                  style={{
                    background: "transparent",
                    border: "1px dashed #ffffff0f",
                    color: addPending ? "#4A5568" : "#8B95A8",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  onClick={() => setPickerDayId(currentDay.id)}
                  disabled={addPending}
                  id={`add-exercise-day-${currentDay.id}`}
                >
                  {addPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  {addPending ? "Agregando..." : "Agregar ejercicio"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {pickerDayId && (
        <ExercisePicker
          exercises={allExercises}
          onPick={(ex) => handlePickExercise(pickerDayId, ex)}
          onClose={() => setPickerDayId(null)}
        />
      )}
    </div>
  );
}

// ─── Exercise Row ──────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise: RoutineExercise;
  index: number;
  onRemove: () => void;
  removePending: boolean;
  onUpdate: (id: string, updatedFields: Partial<RoutineExercise>) => void;
}

function ExerciseRow({
  exercise,
  index,
  onRemove,
  removePending,
  onUpdate,
}: ExerciseRowProps) {
  const [sets, setSets] = useState(String(exercise.targetSets));
  const [warmup, setWarmup] = useState(exercise.warmupSets ?? "");
  const [repsMin, setRepsMin] = useState(String(exercise.targetRepsMin ?? ""));
  const [repsMax, setRepsMax] = useState(String(exercise.targetRepsMax ?? ""));
  const [restTime, setRestTime] = useState(exercise.restTime ?? "");
  const [earlyRpe, setEarlyRpe] = useState(exercise.earlySetRpe ?? "");
  const [technique, setTechnique] = useState(exercise.lastSetTechnique ?? "Fallo");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [techniqueOpen, setTechniqueOpen] = useState(false);

  const isMounted = useRef(false);

  useEffect(() => {
    setSets(String(exercise.targetSets));
    setWarmup(exercise.warmupSets ?? "");
    setRepsMin(String(exercise.targetRepsMin ?? ""));
    setRepsMax(String(exercise.targetRepsMax ?? ""));
    setRestTime(exercise.restTime ?? "");
    setEarlyRpe(exercise.earlySetRpe ?? "");
    setTechnique(exercise.lastSetTechnique ?? "Fallo");
    setNotes(exercise.notes ?? "");
  }, [exercise.id]);

  // Debounced auto-save
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timer = setTimeout(async () => {
      const s = parseInt(sets, 10);
      const rMin = parseInt(repsMin, 10);
      const rMax = parseInt(repsMax, 10);

      if (isNaN(s) || s < 1) return;

      const payload: Parameters<typeof updateRoutineExerciseAction>[0] = {
        routineExerciseId: exercise.id,
        targetSets: s,
        warmupSets: warmup.trim() || null,
        targetRepsMin: !isNaN(rMin) && rMin >= 1 ? rMin : null,
        targetRepsMax: !isNaN(rMax) && rMax >= 1 ? rMax : null,
        restTime: restTime.trim() || null,
        earlySetRpe: earlyRpe.trim() || null,
        lastSetTechnique: technique || null,
        notes: notes.trim() || null,
      };

      setSaving(true);
      try {
        const res = await updateRoutineExerciseAction(payload);
        if (res && "error" in res) {
          console.error("Error saving exercise:", res.error);
        } else {
          onUpdate(exercise.id, {
            targetSets: s,
            warmupSets: warmup.trim() || null,
            targetRepsMin: isNaN(rMin) ? null : rMin,
            targetRepsMax: isNaN(rMax) ? null : rMax,
            restTime: restTime.trim() || null,
            earlySetRpe: earlyRpe.trim() || null,
            lastSetTechnique: technique || null,
            notes: notes.trim() || null,
          });
        }
      } catch (err) {
        console.error("Error updating routine exercise action:", err);
      } finally {
        setSaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [sets, warmup, repsMin, repsMax, restTime, earlyRpe, technique, notes]);

  return (
    <div
      className="rounded-[14px] transition-colors"
      style={{
        background: "var(--color-canvas-overlay)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-2 px-3 py-3"
      >
        {/* Drag handle */}
        <GripVertical
          size={15}
          style={{ color: "var(--color-ink-dimmed)", flexShrink: 0, cursor: "grab" }}
        />

        {/* Index */}
        <span
          className="text-[11px] font-semibold tracking-[0.07em] flex-shrink-0 tabular-nums"
          style={{ color: "var(--color-ink-dimmed)", width: "16px" }}
        >
          {index + 1}
        </span>

        {/* Exercise name + saving indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[15px] font-semibold leading-tight truncate"
              style={{ color: "var(--color-ink)", letterSpacing: "-0.01em" }}
            >
              {exercise.exerciseName}
            </span>
            {saving && (
              <span
                className="text-[10px] font-medium animate-pulse flex-shrink-0"
                style={{ color: "var(--color-primary)" }}
              >
                guardando
              </span>
            )}
          </div>
          <span
            className="text-[12px]"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {exercise.muscleGroup}
          </span>
        </div>

        {/* Notes toggle */}
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="flex-shrink-0 w-[32px] h-[32px] flex items-center justify-center rounded-[6px] transition-colors"
          style={{
            background: notesOpen || notes ? "#6B7BFF1A" : "transparent",
            color: notesOpen || notes ? "#6B7BFF" : "#4A5568",
          }}
          title="Notas"
          aria-label="Mostrar notas"
        >
          <StickyNote size={14} />
        </button>

        {/* Remove */}
        <button
          className="flex-shrink-0 w-[32px] h-[32px] flex items-center justify-center rounded-[6px] transition-colors"
          onClick={onRemove}
          disabled={removePending}
          aria-label="Eliminar ejercicio"
          style={{ color: "#FF6B6B", background: "transparent" }}
        >
          {removePending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>

      {/* Fields row */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-3 sm:pl-[59px] pl-3"
      >
        {/* Work sets */}
        <FieldChip label="Trabajo">
          <InlineInput
            value={sets}
            onChange={setSets}
            type="number"
            width="28px"
            placeholder="3"
            min={1}
            suffix="ser"
          />
        </FieldChip>

        {/* Warmup sets */}
        <FieldChip label="Calent.">
          <InlineTextInput
            value={warmup}
            onChange={setWarmup}
            width="32px"
            placeholder="1-2"
          />
        </FieldChip>

        <Separator />

        {/* Reps */}
        <FieldChip label="Reps">
          <InlineInput
            value={repsMin}
            onChange={setRepsMin}
            type="number"
            width="24px"
            placeholder="8"
            min={1}
          />
          <span style={{ color: "#4A5568", fontSize: "11px" }}>–</span>
          <InlineInput
            value={repsMax}
            onChange={setRepsMax}
            type="number"
            width="24px"
            placeholder="12"
            min={1}
          />
        </FieldChip>

        <Separator />

        {/* Early RPE */}
        <FieldChip label="RPE early">
          <InlineTextInput
            value={earlyRpe}
            onChange={setEarlyRpe}
            width="44px"
            placeholder="~8-9"
          />
        </FieldChip>

        <Separator />

        {/* Last set technique — dropdown */}
        <div className="relative">
          <button
            onClick={() => setTechniqueOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-[6px] transition-colors cursor-pointer"
            style={{
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
              color: technique && technique !== "—" ? "var(--color-primary)" : "var(--color-ink-muted)",
              fontSize: "12px",
              fontWeight: 500,
            }}
            aria-label="Técnica último set"
          >
            <span>{technique || "Fallo"}</span>
            <ChevronDown size={11} style={{ color: "var(--color-ink-dimmed)" }} />
          </button>
          {techniqueOpen && (
            <div
              className="absolute z-20 mt-1 rounded-[10px] py-1 shadow-xl"
              style={{
                background: "var(--color-canvas-overlay)",
                border: "1px solid var(--color-border-strong)",
                minWidth: "160px",
                top: "100%",
                left: 0,
              }}
            >
              {TECHNIQUE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setTechnique(opt);
                    setTechniqueOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer"
                  style={{
                    color: technique === opt ? "var(--color-primary)" : "var(--color-ink)",
                    background: technique === opt ? "var(--color-primary-subtle)" : "transparent",
                    border: "none",
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
          <span style={{ fontSize: "11px", color: "var(--color-ink-dimmed)" }}>⏱</span>
          <InlineTextInput
            value={restTime}
            onChange={setRestTime}
            width="52px"
            placeholder="2-3 min"
          />
        </FieldChip>
      </div>

      {/* Notes panel */}
      {notesOpen && (
        <div
          className="px-3 pb-3 pt-0 sm:pl-[59px] pl-3"
        >
          <div
            className="rounded-[10px] overflow-hidden"
            style={{
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
            }}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cues técnicos, sustituciones, observaciones…"
              rows={3}
              className="w-full bg-transparent px-3 py-2 text-[13px] resize-none focus:outline-none leading-relaxed"
              style={{
                color: "var(--color-ink)",
                caretColor: "var(--color-primary)",
              }}
            />
          </div>
        </div>
      )}
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
        style={{ color: "var(--color-ink-dimmed)" }}
      >
        {label}
      </span>
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-[6px]"
        style={{
          background: "var(--color-canvas-overlay)",
          border: "1px solid var(--color-border-strong)",
          minHeight: "28px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InlineInput({
  value,
  onChange,
  type = "text",
  width,
  placeholder,
  min,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  width: string;
  placeholder?: string;
  min?: number;
  suffix?: string;
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width,
          background: "transparent",
          color: "var(--color-ink)",
          fontSize: "13px",
          fontWeight: 500,
          textAlign: "center",
          fontFeatureSettings: '"tnum"',
          outline: "none",
          border: "none",
          padding: 0,
        }}
        placeholder={placeholder}
        min={min}
      />
      {suffix && (
        <span style={{ fontSize: "11px", color: "var(--color-ink-dimmed)" }}>{suffix}</span>
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
        color: "var(--color-ink)",
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
