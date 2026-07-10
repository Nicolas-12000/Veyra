import type { Metadata } from "next";
import Link from "next/link";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getRoutinesForUser, getRoutineDaysWithExercises } from "@/src/modules/routines/queries";
import { StartSessionButton } from "@/src/modules/sessions/components/StartSessionButton";
import { CalendarDays, Plus, ArrowRight, BookOpen, ChevronRight } from "lucide-react";

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

  const trainingDays = routineDays.filter((d) => !d.isRestDay);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>
          ¿Qué entrenas hoy?
        </h1>
        {activeRoutine && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-body" style={{ color: "var(--color-ink-muted)" }}>
              {activeRoutine.name}
            </span>
            <Link
              href="/routines"
              className="text-caption inline-flex items-center gap-1"
              style={{ color: "var(--color-primary)", textDecoration: "none" }}
            >
              Cambiar rutina <ChevronRight size={11} />
            </Link>
          </div>
        )}
      </div>

      {/* No routine */}
      {!activeRoutine && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <CalendarDays
            size={48}
            style={{ color: "var(--color-ink-dimmed)", margin: "0 auto 16px" }}
          />
          <h2 className="text-display-sm mb-2" style={{ color: "var(--color-ink)" }}>
            Sin rutina activa
          </h2>
          <p className="text-body mb-6" style={{ color: "var(--color-ink-muted)" }}>
            Crea una rutina para entrenar con estructura.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/routines/new"
              className="btn btn-primary no-underline"
              style={{ textDecoration: "none" }}
            >
              <Plus size={16} />
              Crear rutina
            </Link>
            {routines.length > 0 && (
              <Link
                href="/routines"
                className="btn btn-ghost text-caption no-underline"
                style={{ textDecoration: "none", color: "var(--color-ink-muted)" }}
              >
                <BookOpen size={14} />
                Ver mis rutinas
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Days grid */}
      {trainingDays.length > 0 && (
        <div
          className="grid gap-3 mb-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          {trainingDays.map((day) => (
            <div
              key={day.id}
              className="card"
              style={{
                transition: "border-color 120ms ease, background-color 120ms ease",
                padding: "16px",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-label-caps mb-1" style={{ color: "var(--color-ink-muted)" }}>
                    Día {day.dayOrder}
                  </div>
                  <div className="text-display-sm" style={{ color: "var(--color-ink)" }}>
                    {day.dayLabel ?? `Día ${day.dayOrder}`}
                  </div>
                  {day.splitType && (
                    <div className="badge badge-muscle mt-2">
                      {day.splitType.replace("_", " ")}
                    </div>
                  )}
                </div>
              </div>

              {day.exercises && day.exercises.length > 0 && (
                <ul className="mb-4" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {day.exercises.slice(0, 3).map((ex) => (
                    <li
                      key={ex.id}
                      className="text-caption"
                      style={{
                        color: "var(--color-ink-muted)",
                        paddingBottom: "3px",
                        borderBottom: "1px solid var(--color-border)",
                        marginBottom: "3px",
                      }}
                    >
                      {ex.exerciseName}
                      <span
                        className="text-mono"
                        style={{ color: "var(--color-ink-dimmed)", marginLeft: "6px" }}
                      >
                        {ex.targetSets}×{ex.targetRepsMin}
                        {ex.targetRepsMax && ex.targetRepsMax !== ex.targetRepsMin
                          ? `-${ex.targetRepsMax}`
                          : ""}
                      </span>
                    </li>
                  ))}
                  {day.exercises.length > 3 && (
                    <li className="text-caption" style={{ color: "var(--color-ink-dimmed)" }}>
                      +{day.exercises.length - 3} ejercicios más
                    </li>
                  )}
                </ul>
              )}

              {day.exercises.length === 0 && (
                <p
                  className="text-caption mb-4"
                  style={{ color: "var(--color-ink-dimmed)" }}
                >
                  Sin ejercicios.{" "}
                  <Link
                    href={`/routines/${activeRoutine!.id}`}
                    style={{ color: "var(--color-primary)", textDecoration: "none" }}
                  >
                    Editar rutina
                  </Link>
                </p>
              )}

              <StartSessionButton
                routineId={activeRoutine!.id}
                routineDayId={day.id}
                userId={userId}
              />
            </div>
          ))}
        </div>
      )}

      {/* Rest days info */}
      {routineDays.some((d) => d.isRestDay) && (
        <div
          className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
          style={{
            background: "var(--color-canvas-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <CalendarDays size={16} style={{ color: "var(--color-ink-dimmed)", flexShrink: 0 }} />
          <span className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
            {routineDays.filter((d) => d.isRestDay).length} día
            {routineDays.filter((d) => d.isRestDay).length !== 1 ? "s" : ""} de descanso en esta rutina.
          </span>
        </div>
      )}

      {/* Edit routine link */}
      {activeRoutine && (
        <Link
          href={`/routines/${activeRoutine.id}`}
          className="block no-underline mb-4"
        >
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: "var(--color-canvas-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={16} style={{ color: "var(--color-ink-dimmed)" }} />
              <div>
                <div className="text-body-strong" style={{ color: "var(--color-ink)" }}>
                  Editar rutina
                </div>
                <div className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                  Añade o cambia ejercicios
                </div>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: "var(--color-ink-dimmed)" }} />
          </div>
        </Link>
      )}

      {/* Custom session */}
      <div>
        <div
          className="card"
          style={{ borderStyle: "dashed", borderColor: "var(--color-border-strong)", padding: "16px" }}
        >
          <div className="flex items-center justify-between gap-4">
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
