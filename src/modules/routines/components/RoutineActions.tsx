"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Copy,
  Archive,
  MoreHorizontal,
  Loader2,
  Check,
} from "lucide-react";
import { switchActiveRoutine } from "@/src/modules/routines/actions/switch-active-routine";
import { duplicateRoutine } from "@/src/modules/routines/actions/duplicate-routine";
import { archiveRoutineAction } from "@/src/modules/routines/actions/archive-routine";

interface RoutineActionsProps {
  routineId: string;
  isActive: boolean;
}

export function RoutineActions({ routineId, isActive }: RoutineActionsProps) {
  const [open, setOpen] = useState(false);
  const [activatePending, startActivate] = useTransition();
  const [duplicatePending, startDuplicate] = useTransition();
  const [archivePending, startArchive] = useTransition();
  const [activated, setActivated] = useState(false);
  const router = useRouter();

  function handleActivate() {
    setOpen(false);
    startActivate(async () => {
      await switchActiveRoutine(routineId);
      setActivated(true);
      setTimeout(() => setActivated(false), 2000);
      router.refresh();
    });
  }

  function handleDuplicate() {
    setOpen(false);
    startDuplicate(async () => {
      await duplicateRoutine(routineId);
    });
  }

  function handleArchive() {
    if (!confirm("¿Archivar esta rutina? Podrás recuperarla más tarde.")) return;
    setOpen(false);
    startArchive(async () => {
      await archiveRoutineAction({ routineId });
      router.push("/routines");
    });
  }

  const anyPending = activatePending || duplicatePending || archivePending;

  return (
    <div className="relative">
      <button
        className="btn-icon cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        disabled={anyPending}
        aria-label="Acciones de rutina"
        id={`routine-menu-${routineId}`}
      >
        {anyPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : activated ? (
          <Check size={16} style={{ color: "var(--color-success)" }} />
        ) : (
          <MoreHorizontal size={16} />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden animate-fade-in"
            style={{
              background: "var(--color-canvas-overlay)",
              border: "1px solid var(--color-border-strong)",
              minWidth: "180px",
            }}
          >
            {!isActive && (
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
                style={{ color: "var(--color-primary)", fontSize: "14px", fontWeight: 500, background: "none", border: "none" }}
                onClick={handleActivate}
              >
                <Zap size={15} />
                Activar rutina
              </button>
            )}
            {isActive && (
              <div
                className="w-full flex items-center gap-3 px-4 py-3"
                style={{ color: "var(--color-success)", fontSize: "14px", fontWeight: 500 }}
              >
                <Zap size={15} />
                Rutina activa
              </div>
            )}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ color: "var(--color-ink-muted)", fontSize: "14px", fontWeight: 500, background: "none", border: "none" }}
              onClick={handleDuplicate}
            >
              <Copy size={15} />
              Duplicar
            </button>
            <div style={{ height: "1px", background: "var(--color-border)", margin: "0 12px" }} />
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ color: "var(--color-danger)", fontSize: "14px", fontWeight: 500, background: "none", border: "none" }}
              onClick={handleArchive}
            >
              <Archive size={15} />
              Archivar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
