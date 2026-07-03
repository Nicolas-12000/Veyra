"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Search, Plus, Loader2, X, ArrowLeft } from "lucide-react";
import { createExerciseAction } from "@/src/modules/exercises/actions/create-exercise";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
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

const SPLIT_OPTIONS = [
  { value: "pecho", label: "Pecho" },
  { value: "espalda", label: "Espalda" },
  { value: "hombros", label: "Hombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "cuadriceps", label: "Cuádriceps" },
  { value: "isquios", label: "Isquios" },
  { value: "gluteos", label: "Glúteos" },
  { value: "pantorrillas", label: "Pantorrillas" },
  { value: "core", label: "Core" },
];

interface ExercisePickerProps {
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ exercises, onPick, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createPending, startCreateTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<string>("pecho");
  const [newPattern, setNewPattern] = useState<string>("");
  const [newMechanic, setNewMechanic] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreating) {
      inputRef.current?.focus();
    }
  }, [isCreating]);

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(query.toLowerCase()) ||
    (MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup)
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  // Group by muscle
  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const key = ex.muscleGroup;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!newName.trim()) {
      setCreateError("El nombre es requerido.");
      return;
    }

    startCreateTransition(async () => {
      const payload: any = {
        name: newName.trim(),
        muscleGroup: newMuscle,
      };

      if (newPattern) payload.movementPattern = newPattern;
      if (newMechanic) payload.mechanic = newMechanic;

      const result = await createExerciseAction(payload);

      if ("error" in result) {
        setCreateError("Error al crear el ejercicio. Intenta con otro nombre.");
        return;
      }

      // Automatically pick the newly created exercise
      onPick({
        id: result.exerciseId,
        name: newName.trim(),
        muscleGroup: newMuscle,
      });
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "var(--color-scrim)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in"
        style={{
          background: "var(--color-canvas-overlay)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          maxHeight: "85dvh",
          height: isCreating ? "580px" : "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: "36px", height: "4px", background: "var(--color-border-strong)", borderRadius: "var(--radius-pill)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isCreating && (
              <button
                className="btn-icon cursor-pointer"
                onClick={() => setIsCreating(false)}
                style={{ width: "32px", height: "32px" }}
                aria-label="Volver"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>
              {isCreating ? "Crear ejercicio" : "Agregar ejercicio"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                className="btn btn-primary btn-sm text-[13px] font-semibold cursor-pointer"
                style={{
                  borderRadius: "var(--radius-md)",
                  height: "32px",
                  padding: "4px 12px",
                  fontSize: "12px",
                }}
                onClick={() => {
                  setIsCreating(true);
                  setNewName(query);
                }}
              >
                <Plus size={14} />
                Nuevo
              </button>
            )}
            <button className="btn-icon cursor-pointer" onClick={onClose} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form or Search Picker */}
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col px-5 pb-5 overflow-y-auto">
            {createError && (
              <div className="mb-4 p-3 rounded-lg text-caption" style={{ background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}>
                {createError}
              </div>
            )}

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-label-caps mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Nombre del Ejercicio *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Prensa de piernas, Curl inclinado..."
                />
              </div>

              <div>
                <label className="text-label-caps mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Grupo Muscular Principal *</label>
                <select
                  className="input"
                  style={{
                    appearance: "none",
                    background: "var(--color-canvas-overlay) url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238E8EA0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\") no-repeat right 16px top 50% / 12px auto",
                  }}
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                >
                  {SPLIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-caps mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Patrón de Movimiento</label>
                  <select
                    className="input"
                    style={{
                      appearance: "none",
                      background: "var(--color-canvas-overlay) url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238E8EA0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\") no-repeat right 16px top 50% / 12px auto",
                    }}
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                  >
                    <option value="" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Ninguno</option>
                    <option value="empuje_horizontal" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Empuje Horizontal</option>
                    <option value="empuje_vertical" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Empuje Vertical</option>
                    <option value="jale_horizontal" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Jale Horizontal</option>
                    <option value="jale_vertical" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Jale Vertical</option>
                    <option value="sentadilla" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Sentadilla</option>
                    <option value="bisagra" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Bisagra (Peso Muerto)</option>
                    <option value="aislamiento" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Aislamiento</option>
                    <option value="core" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Core</option>
                  </select>
                </div>

                <div>
                  <label className="text-label-caps mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Mecánica</label>
                  <select
                    className="input"
                    style={{
                      appearance: "none",
                      background: "var(--color-canvas-overlay) url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238E8EA0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\") no-repeat right 16px top 50% / 12px auto",
                    }}
                    value={newMechanic}
                    onChange={(e) => setNewMechanic(e.target.value)}
                  >
                    <option value="" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Ninguno</option>
                    <option value="compound" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Compuesto</option>
                    <option value="isolation" style={{ background: "var(--color-canvas-overlay)", color: "var(--color-ink)" }}>Aislamiento</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-auto">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setIsCreating(false)}
                disabled={createPending}
              >
                Atrás
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={createPending}
              >
                {createPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {createPending ? "Creando..." : "Crear y agregar"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Search Input */}
            <div className="px-5 pb-3 flex-shrink-0">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-ink-dimmed)" }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  className="input"
                  style={{ paddingLeft: "40px" }}
                  placeholder="Buscar ejercicio..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  id="exercise-picker-search"
                />
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
              {filtered.length === 0 ? (
                <div className="text-center py-12 px-5 flex flex-col items-center">
                  <span className="text-caption mb-4" style={{ color: "var(--color-ink-dimmed)" }}>
                    Sin resultados para "{query}"
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: "var(--radius-sm)", height: "36px", padding: "6px 16px" }}
                    onClick={() => {
                      setIsCreating(true);
                      setNewName(query);
                    }}
                  >
                    <Plus size={14} className="mr-1" />
                    Crear "{query || "ejercicio"}"
                  </button>
                </div>
              ) : (
                Object.entries(grouped).map(([muscle, exs]) => (
                  <div key={muscle}>
                    <div
                      className="text-label-caps px-5 py-2 sticky top-0"
                      style={{ color: "var(--color-ink-dimmed)", background: "var(--color-canvas-overlay)", zIndex: 1 }}
                    >
                      {MUSCLE_LABELS[muscle] ?? muscle}
                    </div>
                    {exs.map((ex) => (
                      <button
                        key={ex.id}
                        className="w-full flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--color-canvas-elevated)] text-left cursor-pointer"
                        style={{ border: "none", background: "none" }}
                        onClick={() => onPick(ex)}
                        id={`pick-exercise-${ex.id}`}
                      >
                        <span className="text-body-strong" style={{ color: "var(--color-ink)" }}>{ex.name}</span>
                        <Plus size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
