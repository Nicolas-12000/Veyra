"use client";

import { useState, useTransition } from "react";
import { Loader2, Scale, CheckCircle2 } from "lucide-react";
import { logBodyWeight } from "@/src/modules/body-weight/actions/log-body-weight";

type Unit = "kg" | "lb";

const KG_TO_LB = 2.20462;
const LB_TO_KG = 0.453592;

export function LogWeightForm({ unit, onSuccess }: { unit: Unit; onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minW = unit === "lb" ? 44 : 20;
  const maxW = unit === "lb" ? 880 : 400;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate date
    if (!date) {
      setError("La fecha es obligatoria.");
      return;
    }
    const dateObj = new Date(date + "T12:00:00");
    if (isNaN(dateObj.getTime())) {
      setError("Fecha inválida.");
      return;
    }
    if (dateObj > new Date()) {
      setError("La fecha no puede ser futura.");
      return;
    }

    // Validate weight
    const numeric = parseFloat(value);
    const minW = unit === "lb" ? 44 : 20;   // ~20kg / ~44lb
    const maxW = unit === "lb" ? 880 : 400; // ~400kg / ~880lb
    if (isNaN(numeric) || numeric <= 0) {
      setError("Ingresa un peso válido.");
      return;
    }
    if (numeric < minW || numeric > maxW) {
      setError(`El peso debe estar entre ${minW} y ${maxW} ${unit}.`);
      return;
    }

    const weightKg = unit === "lb" ? numeric * LB_TO_KG : numeric;

    startTransition(async () => {
      const res = await logBodyWeight({
        weightKg,
        recordedDate: dateObj,
        notes: notes.trim() || undefined,
      });

      if ("error" in res) {
        setError(
          typeof res.error === "string"
            ? res.error
            : "Error al guardar. Verifica que no tengas ya un registro en esa fecha."
        );
        return;
      }

      setSuccess(true);
      setValue("");
      setNotes("");
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 1200);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        {/* Weight input */}
        <div>
          <label
            htmlFor="weight-val"
            className="text-label-caps block mb-2"
            style={{ color: "var(--color-ink-muted)" }}
          >
            Peso ({unit})
          </label>
          <div className="flex items-center gap-3">
            <input
              id="weight-val"
              type="number"
              step="0.1"
              min={String(minW)}
              max={String(maxW)}
              className="input-number-large flex-1"
              style={{ textAlign: "center" }}
              placeholder={unit === "kg" ? "75.0" : "165.0"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
            />
            <div
              className="text-display-sm flex-shrink-0"
              style={{ color: "var(--color-primary)", minWidth: "36px" }}
            >
              {unit}
            </div>
          </div>
          {value && !isNaN(parseFloat(value)) && (
            <div
              className="text-caption mt-2"
              style={{ color: "var(--color-ink-dimmed)" }}
            >
              {unit === "lb"
                ? `= ${(parseFloat(value) * LB_TO_KG).toFixed(2)} kg`
                : `= ${(parseFloat(value) * KG_TO_LB).toFixed(1)} lb`}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="weight-date"
            className="text-label-caps block mb-2"
            style={{ color: "var(--color-ink-muted)" }}
          >
            Fecha
          </label>
          <input
            id="weight-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="weight-notes"
            className="text-label-caps block mb-2"
            style={{ color: "var(--color-ink-muted)" }}
          >
            Notas <span style={{ color: "var(--color-ink-dimmed)" }}>(opcional)</span>
          </label>
          <input
            id="weight-notes"
            type="text"
            className="input"
            placeholder="Ej: Después de ayuno, con ropa..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
        <div
          className="mt-3 flex items-center gap-2 text-body"
          style={{ color: "var(--color-success)" }}
        >
          <CheckCircle2 size={16} />
          Peso guardado correctamente
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full mt-5"
        disabled={isPending || !value}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Scale size={16} />
            Registrar peso
          </>
        )}
      </button>
    </form>
  );
}
