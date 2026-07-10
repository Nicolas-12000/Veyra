import { notFound, redirect } from "next/navigation";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getFullRoutineWithDays } from "@/src/modules/routines/queries";
import { listExercises } from "@/src/modules/exercises/services";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { RoutineActions } from "@/src/modules/routines/components/RoutineActions";
import { RoutineEditor } from "@/src/modules/routines/components/RoutineEditor";
import { StartSessionButton } from "@/src/modules/sessions/components/StartSessionButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ routineId: string }>;
}): Promise<Metadata> {
  const { routineId } = await params;
  const routine = await getFullRoutineWithDays(routineId);
  return { title: routine?.name ?? "Rutina" };
}

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    redirect("/login");
  }

  const { routineId } = await params;

  const [routineData, profile, allExercises] = await Promise.all([
    getFullRoutineWithDays(routineId),
    getUserProfile(userId),
    listExercises(),
  ]);

  if (!routineData || routineData.userId !== userId) {
    notFound();
  }

  const isActive = profile?.activeRoutineId === routineId;

  return (
    <div className="page-content pb-32">
      {/* Back nav */}
      <Link
        href="/routines"
        className="text-caption inline-flex items-center gap-2 mb-6 no-underline transition-colors"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft size={16} />
        Volver a rutinas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-display-md" style={{ color: "var(--color-ink)" }}>{routineData.name}</h1>
            {isActive && (
              <span
                className="badge"
                style={{
                  background: "var(--color-primary-subtle)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(107,123,255,0.35)",
                }}
              >
                Activa
              </span>
            )}
          </div>
          {routineData.description && (
            <p className="text-body" style={{ color: "var(--color-ink-muted)" }}>{routineData.description}</p>
          )}
          <p className="text-caption mt-1" style={{ color: "var(--color-ink-dimmed)" }}>
            {routineData.days.length} día{routineData.days.length !== 1 ? "s" : ""}
          </p>
        </div>

        <RoutineActions routineId={routineId} isActive={isActive} />
      </div>

      {/* No days */}
      {routineData.days.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-body" style={{ color: "var(--color-ink-muted)" }}>
            Esta rutina no tiene días configurados.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Editor inline + StartSessionButton */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Pencil size={16} style={{ color: "var(--color-primary)" }} />
                <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Editar ejercicios</h2>
              </div>
            </div>
            <RoutineEditor
              routineId={routineId}
              days={routineData.days}
              allExercises={allExercises}
            />
          </div>

          {/* Session start per day */}
          <div className="card">
            <h2 className="text-display-sm mb-6" style={{ color: "var(--color-ink)" }}>Iniciar sesión</h2>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {routineData.days
                .filter((d) => !d.isRestDay)
                .map((day) => (
                  <div
                    key={day.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--color-canvas-overlay)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="text-label-caps mb-1" style={{ color: "var(--color-ink-dimmed)" }}>
                      Día {day.dayOrder}
                    </div>
                    <div className="text-body-strong mb-1" style={{ color: "var(--color-ink)" }}>
                      {day.dayLabel ?? `Día ${day.dayOrder}`}
                    </div>
                    {day.splitType && (
                      <div className="text-caption mb-3" style={{ color: "var(--color-ink-muted)" }}>
                        {day.splitType.replace("_", " ")}
                      </div>
                    )}
                    <div className="text-caption mb-3" style={{ color: "var(--color-ink-dimmed)" }}>
                      {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
                    </div>
                    <StartSessionButton
                      userId={userId}
                      routineId={routineId}
                      routineDayId={day.id}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
