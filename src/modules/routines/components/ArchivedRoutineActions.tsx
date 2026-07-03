"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";

import { restoreRoutineAction } from "@/src/modules/routines/actions/restore-routine";

interface ArchivedRoutineActionsProps {
  routineId: string;
}

export function ArchivedRoutineActions({ routineId }: ArchivedRoutineActionsProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRestore() {
    startTransition(async () => {
      await restoreRoutineAction({ routineId });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm inline-flex w-fit items-center gap-2 no-underline cursor-pointer"
      onClick={handleRestore}
      disabled={pending}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
      Restaurar
    </button>
  );
}