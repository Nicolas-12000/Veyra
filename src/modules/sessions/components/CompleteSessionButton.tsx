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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: "var(--color-scrim)" }}>
          <div className="card max-w-sm w-full relative" style={{ border: "1px solid var(--color-border-strong)", background: "var(--color-canvas-overlay)" }}>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 transition-colors cursor-pointer"
              style={{ color: "var(--color-ink-muted)" }}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--color-warning-subtle)", color: "var(--color-warning)" }}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-display-sm mb-2" style={{ color: "var(--color-ink)" }}>¿Terminar entrenamiento?</h3>
              <p className="text-body mb-6" style={{ color: "var(--color-ink-muted)" }}>
                Se registrarán todas las series y cargas completadas en esta sesión. No podrás editar los sets después.
              </p>

              {error && (
                <div className="text-caption mb-4" style={{ color: "var(--color-danger)" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="btn btn-secondary flex-1 py-3"
                >
                  Volver
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isPending}
                  className="btn btn-primary flex-1 py-3"
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
