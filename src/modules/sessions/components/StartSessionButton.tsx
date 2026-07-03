"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSession } from "@/src/modules/sessions/actions/start-session";
import { Play, Loader2 } from "lucide-react";

interface StartSessionButtonProps {
  userId: string;
  routineId?: string;
  routineDayId?: string;
}

export function StartSessionButton({
  userId,
  routineId,
  routineDayId,
}: StartSessionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStart() {
    startTransition(async () => {
      const result = await startSession({
        userId,
        routineId,
        routineDayId,
      });

      if (result?.sessionId) {
        router.push(`/session/${result.sessionId}`);
      }
    });
  }

  return (
    <button
      onClick={handleStart}
      disabled={isPending}
      className="btn btn-primary w-full"
      style={{ marginTop: "auto" }}
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Play size={16} />
      )}
      {isPending ? "Iniciando..." : "Iniciar"}
    </button>
  );
}
