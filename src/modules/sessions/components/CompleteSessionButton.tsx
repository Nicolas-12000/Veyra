"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSession } from "@/src/modules/sessions/actions/complete-session";
import { CheckCircle2, Loader2, AlertTriangle, X } from "lucide-react";

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const res = await completeSession({ sessionId });
      if (res && "error" in res) {
        setError("Error al finalizar el entrenamiento. Intenta de nuevo.");
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="btn btn-primary"
      >
        <CheckCircle2 size={20} />
        Finalizar Entrenamiento
      </button>

      {/* Inline Premium Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          style={{ background: "var(--color-scrim)" }}
        >
          <div
            className="w-full relative rounded-[20px] px-8 py-7"
            style={{
              maxWidth: "420px",
              minWidth: "320px",
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ color: "var(--color-ink-muted)", background: "var(--color-border)" }}
              aria-label="Cerrar modal"
            >
              <X size={15} />
            </button>

            <div className="flex flex-col items-center text-center gap-3">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                style={{ background: "var(--color-warning-subtle)", color: "var(--color-warning)" }}
              >
                <AlertTriangle size={26} />
              </div>

              {/* Title */}
              <h3
                className="text-[20px] font-bold leading-tight"
                style={{ color: "var(--color-ink)", letterSpacing: "-0.02em" }}
              >
                ¿Terminar entrenamiento?
              </h3>

              {/* Body */}
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--color-ink-muted)", maxWidth: "300px" }}
              >
                Se registrarán todas las series y cargas completadas en esta sesión. No podrás editar los sets después.
              </p>

              {error && (
                <p className="text-[13px]" style={{ color: "var(--color-danger)" }}>
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 w-full mt-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="btn btn-secondary flex-1"
                  style={{ paddingTop: "12px", paddingBottom: "12px" }}
                >
                  Volver
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isPending}
                  className="btn btn-primary flex-1"
                  style={{ paddingTop: "12px", paddingBottom: "12px" }}
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Sí, finalizar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
