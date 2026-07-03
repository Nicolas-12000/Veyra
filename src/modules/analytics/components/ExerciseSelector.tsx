"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Search } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

type Props = {
  exercises: Exercise[];
  selected: string[];
  onChange: (ids: string[]) => void;
  maxSelect?: number;
};

export function ExerciseSelector({ exercises, selected, onChange, maxSelect = 3 }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  const selectedExercises = exercises.filter((ex) => selected.includes(ex.id));

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < maxSelect) {
      onChange([...selected, id]);
    }
  }

  const EXERCISE_COLORS = [
    "var(--color-primary)",
    "var(--color-success)",
    "var(--color-warning)",
    "var(--color-danger)",
    "var(--color-chart-brazos)",
    "var(--color-chart-core)"
  ];

  return (
    <div ref={ref} className="relative">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedExercises.map((ex, i) => (
          <div
            key={ex.id}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium"
            style={{
              background: `rgba(107, 123, 255, 0.15)`,
              border: `1px solid ${EXERCISE_COLORS[i % EXERCISE_COLORS.length]}`,
              color: EXERCISE_COLORS[i % EXERCISE_COLORS.length],
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: EXERCISE_COLORS[i % EXERCISE_COLORS.length],
                flexShrink: 0,
              }}
            />
            {ex.name}
            <button
              onClick={() => toggle(ex.id)}
              className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
              aria-label={`Quitar ${ex.name}`}
              style={{ background: "none", border: "none", color: "inherit", padding: 0 }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {selected.length < maxSelect && (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-all cursor-pointer"
            style={{
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-ink-muted)",
            }}
          >
            + Agregar ejercicio
            <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 rounded-xl overflow-hidden"
          style={{
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--color-canvas-overlay)",
            border: "1px solid var(--color-border-strong)",
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <Search size={14} style={{ color: "var(--color-ink-dimmed)", flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="flex-1 bg-transparent text-[14px] outline-none"
              style={{ color: "var(--color-ink)", border: "none" }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-caption" style={{ color: "var(--color-ink-dimmed)" }}>
                Sin resultados
              </div>
            ) : (
              filtered.map((ex) => {
                const isSelected = selected.includes(ex.id);
                const idx = selected.indexOf(ex.id);
                const canSelect = !isSelected && selected.length < maxSelect;
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggle(ex.id)}
                    disabled={!isSelected && selected.length >= maxSelect}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                    style={{
                      background: isSelected ? "var(--color-canvas-hover)" : "transparent",
                      opacity: !isSelected && selected.length >= maxSelect ? 0.4 : 1,
                      cursor: canSelect || isSelected ? "pointer" : "not-allowed",
                      border: "none",
                    }}
                  >
                    <div>
                      <div className="text-[14px] font-medium" style={{ color: "var(--color-ink)" }}>
                        {ex.name}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--color-ink-dimmed)", textTransform: "capitalize" }}>
                        {ex.muscleGroup}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: EXERCISE_COLORS[idx % EXERCISE_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {selected.length >= maxSelect && (
            <div
              className="px-4 py-2 text-caption text-center"
              style={{ color: "var(--color-ink-muted)", borderTop: "1px solid var(--color-border)" }}
            >
              Máximo {maxSelect} ejercicios
            </div>
          )}
        </div>
      )}
    </div>
  );
}
