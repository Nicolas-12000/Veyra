"use client";

import { useTransition } from "react";
import { updateUnitPref } from "@/src/modules/body-weight/actions/update-unit-pref";
import { Scale } from "lucide-react";

type Props = {
  currentUnit: "kg" | "lb";
};

export function UnitPrefForm({ currentUnit }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (unit: "kg" | "lb") => {
    if (unit === currentUnit || isPending) return;
    startTransition(async () => {
      await updateUnitPref({ unitPref: unit });
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Scale size={16} style={{ color: "var(--color-ink-muted)" }} />
        <span className="text-body" style={{ color: "var(--color-ink-muted)" }}>Unidad de Medida</span>
      </div>

      <div
        className="relative flex items-center p-1 gap-1"
        style={{
          background: "var(--color-canvas-overlay)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {/* Animated background */}
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded transition-all duration-300"
          style={{
            width: "calc(50% - 4px)",
            background: "var(--color-primary-subtle)",
            border: "1px solid var(--color-primary)",
            left: currentUnit === "kg" ? "4px" : "calc(50%)",
            borderRadius: "var(--radius-sm)",
          }}
        />

        <button
          id="unit-kg-btn"
          type="button"
          disabled={isPending}
          onClick={() => handleToggle("kg")}
          className="relative z-10 px-5 py-2 text-sm font-semibold transition-colors duration-200"
          style={{
            color: currentUnit === "kg" ? "var(--color-primary)" : "var(--color-ink-muted)",
            cursor: isPending ? "wait" : "pointer",
            background: "none",
            border: "none",
          }}
        >
          KG
        </button>

        <button
          id="unit-lb-btn"
          type="button"
          disabled={isPending}
          onClick={() => handleToggle("lb")}
          className="relative z-10 px-5 py-2 text-sm font-semibold transition-colors duration-200"
          style={{
            color: currentUnit === "lb" ? "var(--color-primary)" : "var(--color-ink-muted)",
            cursor: isPending ? "wait" : "pointer",
            background: "none",
            border: "none",
          }}
        >
          LB
        </button>
      </div>
    </div>
  );
}
