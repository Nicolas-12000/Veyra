import type { Metadata } from "next";
import Link from "next/link";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getRoutinesForUser, getRoutineDaysWithExercises } from "@/src/modules/routines/queries";
import { StartSessionButton } from "@/src/modules/sessions/components/StartSessionButton";
import { CalendarDays, Plus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Nueva Sesión",
};

export default async function SessionPage() {
  const userId = await requireUserId();

  const [profile, routines] = await Promise.all([
    getUserProfile(userId),
    getRoutinesForUser(userId),
  ]);

  const activeRoutineId = profile?.activeRoutineId;
  const activeRoutine = routines.find((r) => r.id === activeRoutineId) ?? routines[0] ?? null;
  
  let routineDays: Awaited<ReturnType<typeof getRoutineDaysWithExercises>> = [];
  if (activeRoutine) {
    routineDays = await getRoutineDaysWithExercises(activeRoutine.id);
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>
          ¿Qué entrenas hoy?
        </h1>
        {activeRoutine && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-body" style={{ color: "var(--color-ink-muted)" }}>
              {activeRoutine.name}
            </span>
            <Link
              href="/routines"
              className="text-caption"
              style={{ color: "var(--color-primary)", textDecoration: "none" }}
            >
              Cambiar
            </Link>
          </div>
        )}
      </div>

      {/* No routine */}
      {!activeRoutine && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <CalendarDays size={48} style={{ color: "var(--color-ink-dimmed)", margin: "0 auto 16px" }} />
          <h2 className="text-display-sm mb-2" style={{ color: "var(--color-ink)" }}>
            Sin rutina activa
          </h2>
          <p className="text-body mb-6" style={{ color: "var(--color-ink-muted)" }}>
            Crea una rutina para empezar a entrenar con estructura.
          </p>
          <Link href="/routines" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Plus size={16} />
            Crear rutina
          </Link>
        </div>
      )}

      {/* Days grid */}
      {routineDays.length > 0 && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          {routineDays.map((day) => (
            <div
              key={day.id}
              className="card"
              style={{
                cursor: day.isRestDay ? "default" : "pointer",
                opacity: day.isRestDay ? 0.5 : 1,
                transition: "border-color 120ms ease, background-color 120ms ease",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-label-caps mb-1" style={{ color: "var(--color-ink-muted)" }}>
                    Día {day.dayOrder}
                  </div>
                  <div className="text-display-sm" style={{ color: "var(--color-ink)" }}>
                    {day.dayLabel ?? (day.isRestDay ? "Descanso" : `Día ${day.dayOrder}`)}
                  </div>
                  {day.splitType && (
                    <div className="badge badge-muscle mt-2">
                      {day.splitType.replace("_", " ")}
                    </div>
                  )}
                </div>
              </div>

              {!day.isRestDay && day.exercises && day.exercises.length > 0 && (
                <ul className="mb-4" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {day.exercises.slice(0, 4).map((ex) => (
                    <li
                      key={ex.id}
                      className="text-body"
                      style={{
                        color: "var(--color-ink-muted)",
                        paddingBottom: "4px",
                        borderBottom: "1px solid var(--color-border)",
                        marginBottom: "4px",
                      }}
                    >
                      {ex.exerciseName}
                      <span className="text-mono" style={{ color: "var(--color-ink-dimmed)", marginLeft: "8px" }}>
                        {ex.targetSets}×{ex.targetRepsMin}
                        {ex.targetRepsMax && ex.targetRepsMax !== ex.targetRepsMin ? `-${ex.targetRepsMax}` : ""}
                      </span>
                    </li>
                  ))}
                  {day.exercises.length > 4 && (
                    <li className="text-caption" style={{ color: "var(--color-ink-dimmed)" }}>
                      +{day.exercises.length - 4} más
                    </li>
                  )}
                </ul>
              )}

              {!day.isRestDay && (
                <StartSessionButton
                  routineId={activeRoutine!.id}
                  routineDayId={day.id}
                  userId={userId}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom session */}
      <div className="mt-6">
        <div className="card" style={{ borderStyle: "dashed", borderColor: "var(--color-border-strong)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-body-strong" style={{ color: "var(--color-ink)" }}>
                Sesión libre
              </div>
              <div className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                Sin rutina predefinida
              </div>
            </div>
            <StartSessionButton userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}
