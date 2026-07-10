"use client";

import { useState, useTransition } from "react";
import { Calendar, Edit2, Trash2, X, Loader2, CheckCircle2, Scale } from "lucide-react";
import { updateBodyWeightAction } from "@/src/modules/body-weight/actions/update-body-weight";
import { deleteBodyWeightAction } from "@/src/modules/body-weight/actions/delete-body-weight";

type Unit = "kg" | "lb";

const KG_TO_LB = 2.20462;
const LB_TO_KG = 0.453592;

interface Metric {
  id: string;
  recordedDate: string;
  weightKg: string;
  notes: string | null;
}

interface Props {
  metrics: Metric[];
  unit: Unit;
}

export function WeightHistoryList({ metrics, unit }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editMetric, setEditMetric] = useState<Metric | null>(null);
  const [deleteMetric, setDeleteMetric] = useState<Metric | null>(null);

  // Form states for editing
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleOpenEdit(m: Metric) {
    setEditMetric(m);
    setError(null);
    setSuccess(false);

    const originalKg = Number(m.weightKg);
    const displayWeight = unit === "lb" ? originalKg * KG_TO_LB : originalKg;
    setEditValue(displayWeight.toFixed(1));
    setEditDate(m.recordedDate);
    setEditNotes(m.notes ?? "");
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editMetric) return;

    setError(null);
    const numeric = parseFloat(editValue);
    if (isNaN(numeric) || numeric <= 0) {
      setError("Ingresa un peso válido.");
      return;
    }

    const weightKg = unit === "lb" ? numeric * LB_TO_KG : numeric;

    startTransition(async () => {
      const res = await updateBodyWeightAction({
        id: editMetric.id,
        weightKg,
        recordedDate: new Date(editDate + "T12:00:00"),
        notes: editNotes.trim() || undefined,
      });

      if ("error" in res) {
        setError(typeof res.error === "string" ? res.error : "Error al guardar los cambios.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setEditMetric(null);
      }, 1000);
    });
  }

  function handleDeleteConfirm() {
    if (!deleteMetric) return;

    startTransition(async () => {
      const res = await deleteBodyWeightAction({ id: deleteMetric.id });
      if (res && "error" in res) {
        alert(res.error);
        return;
      }
      setDeleteMetric(null);
    });
  }

  return (
    <div className="space-y-4">
      {metrics.map((m) => {
        const displayWeight = unit === "lb"
          ? (Number(m.weightKg) * KG_TO_LB).toFixed(1)
          : Number(m.weightKg).toFixed(1);

        return (
          <div
            key={m.id}
            className="flex items-center justify-between py-3.5 px-4 rounded-xl border transition-all duration-200"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-canvas-elevated)",
            }}
          >
            <div className="flex items-start gap-3">
              <Calendar size={18} className="mt-0.5" style={{ color: "var(--color-ink-muted)" }} />
              <div>
                <div className="text-body-strong flex items-center gap-2 whitespace-nowrap" style={{ color: "var(--color-ink)" }}>
                  {m.recordedDate}
                  {m.notes && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "var(--color-canvas-overlay)",
                        border: "1px solid var(--color-border-strong)",
                        color: "var(--color-ink-muted)",
                      }}
                      title={m.notes}
                    >
                      Nota
                    </span>
                  )}
                </div>
                {m.notes && (
                  <p className="text-caption mt-1 max-w-[280px] sm:max-w-md truncate" style={{ color: "var(--color-ink-muted)" }}>
                    {m.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-mono text-metric-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                {displayWeight} {unit}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="btn-icon cursor-pointer"
                  style={{ color: "var(--color-ink-muted)" }}
                  title="Editar registro"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => setDeleteMetric(m)}
                  className="btn-icon cursor-pointer"
                  style={{ color: "var(--color-danger)" }}
                  title="Eliminar registro"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Edit Modal Overlay */}
      {editMetric && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "var(--color-scrim)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setEditMetric(null);
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              padding: "28px 24px 40px",
              width: "100%",
              maxWidth: "480px",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>
                Editar Registro
              </h2>
              <button
                className="btn-icon cursor-pointer"
                onClick={() => setEditMetric(null)}
                disabled={isPending}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid gap-4">
                {/* Weight input */}
                <div>
                  <label className="text-label-caps block mb-2" style={{ color: "var(--color-ink-muted)" }}>
                    Peso ({unit})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="500"
                      className="input-number-large flex-1"
                      style={{ textAlign: "center" }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="text-display-sm flex-shrink-0" style={{ color: "var(--color-primary)", minWidth: "36px" }}>
                      {unit}
                    </div>
                  </div>
                  {editValue && !isNaN(parseFloat(editValue)) && (
                    <div className="text-caption mt-2" style={{ color: "var(--color-ink-dimmed)" }}>
                      {unit === "lb"
                        ? `= ${(parseFloat(editValue) * LB_TO_KG).toFixed(2)} kg`
                        : `= ${(parseFloat(editValue) * KG_TO_LB).toFixed(1)} lb`}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="text-label-caps block mb-2" style={{ color: "var(--color-ink-muted)" }}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-label-caps block mb-2" style={{ color: "var(--color-ink-muted)" }}>
                    Notas <span style={{ color: "var(--color-ink-dimmed)" }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              {error && (
                <div className="mt-3 text-body" style={{ color: "var(--color-danger)" }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-3 flex items-center gap-2 text-body" style={{ color: "var(--color-success)" }}>
                  <CheckCircle2 size={16} />
                  Registro actualizado
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full mt-5"
                disabled={isPending || !editValue}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Scale size={16} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Overlay */}
      {deleteMetric && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-scrim)",
            backdropFilter: "blur(4px)",
            padding: "24px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setDeleteMetric(null);
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h3 className="text-display-sm mb-3" style={{ color: "var(--color-ink)" }}>
              ¿Eliminar Registro?
            </h3>
            <p className="text-body mb-6" style={{ color: "var(--color-ink-muted)" }}>
              Esta acción no se puede deshacer. Se eliminará el registro de peso de la fecha{" "}
              <strong style={{ color: "var(--color-ink)" }}>{deleteMetric.recordedDate}</strong>.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                className="btn btn-secondary cursor-pointer"
                onClick={() => setDeleteMetric(null)}
                disabled={isPending}
                style={{ minWidth: "100px" }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger cursor-pointer"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                style={{ minWidth: "120px" }}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {isPending ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
