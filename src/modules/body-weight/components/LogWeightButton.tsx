"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { LogWeightForm } from "./LogWeightForm";

export function LogWeightButton({ unit }: { unit: "kg" | "lb" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setOpen(true)}
        id="log-weight-btn"
      >
        <Plus size={16} />
        Registrar Peso
      </button>

      {/* Overlay */}
      {open && (
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
            if (e.target === e.currentTarget) setOpen(false);
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
                Registrar Peso
              </h2>
              <button
                className="btn-icon cursor-pointer"
                onClick={() => setOpen(false)}
                id="close-log-weight"
              >
                <X size={18} />
              </button>
            </div>

            <LogWeightForm unit={unit} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
