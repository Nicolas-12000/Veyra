import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUserId } from "@/src/modules/auth/server";
import { CreateRoutineForm } from "@/src/modules/routines/components/CreateRoutineForm";
import { listExercises } from "@/src/modules/exercises/services";

export const metadata: Metadata = {
  title: "Nueva Rutina",
};

export default async function NewRoutinePage() {
  await requireUserId();
  const allExercises = await listExercises();

  return (
    <div className="page-content pb-32">
      <div className="mb-8">
        <Link
          href="/routines"
          className="text-caption inline-flex items-center gap-2 mb-4 no-underline transition-colors"
          style={{ color: "#8E8EA0" }}
        >
          <ArrowLeft size={16} />
          Volver a rutinas
        </Link>
        <h1 className="text-display-lg" style={{ color: "#F0F0F3" }}>
          Nueva Rutina
        </h1>
        <p className="text-body mt-2" style={{ color: "#8E8EA0" }}>
          Crea tu programa de entrenamiento personalizado
        </p>
      </div>

      <div style={{ maxWidth: "640px" }}>
        <CreateRoutineForm allExercises={allExercises} />
      </div>
    </div>
  );
}
