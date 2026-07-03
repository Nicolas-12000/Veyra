import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getArchivedRoutinesForUser, getRoutinesForUser } from "@/src/modules/routines/queries";
import { RoutineActions } from "@/src/modules/routines/components/RoutineActions";
import { ArchivedRoutineActions } from "@/src/modules/routines/components/ArchivedRoutineActions";
import { ChevronRight, Plus, LayoutList, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Rutinas",
};

export default async function RoutinesPage() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    redirect("/login");
  }

  const [routines, profile] = await Promise.all([
    getRoutinesForUser(userId),
    getUserProfile(userId),
  ]);
  const archivedRoutines = await getArchivedRoutinesForUser(userId);

  const activeRoutineId = profile?.activeRoutineId;
  const hasAnyRoutines = routines.length > 0 || archivedRoutines.length > 0;

  return (
    <div className="page-content pb-32">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>Rutinas</h1>
        <Link
          href="/routines/new"
          className="btn btn-primary btn-sm text-caption no-underline"
        >
          <Plus size={16} />
          Nueva Rutina
        </Link>
      </div>

      {!hasAnyRoutines ? (
        <div className="card text-center py-16">
          <LayoutList size={48} className="mx-auto mb-4" style={{ color: "var(--color-ink-dimmed)" }} />
          <h2 className="text-body-strong mb-2" style={{ color: "var(--color-ink)" }}>
            No tienes rutinas
          </h2>
          <p className="text-caption mb-6" style={{ color: "var(--color-ink-muted)" }}>
            Empieza creando tu primera rutina para estructurar tu entrenamiento.
          </p>
          <Link href="/routines/new" className="btn btn-primary no-underline inline-flex">
            Crear Rutina
          </Link>
        </div>
      ) : (
        <div className="grid gap-8">
          {routines.length > 0 && (
            <section className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Activas</h2>
                  <p className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                    Rutinas listas para usar y editar.
                  </p>
                </div>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {routines.map((routine) => {
                  const isActive = routine.id === activeRoutineId;
                  return (
                    <div
                      key={routine.id}
                      className="card"
                      style={{
                        border: isActive
                          ? "1px solid rgba(107,123,255,0.35)"
                          : "1px solid var(--color-border)",
                        background: isActive ? "var(--color-primary-subtle)" : "var(--color-canvas-elevated)",
                        transition: "border-color 120ms ease",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isActive && (
                              <Zap
                                size={14}
                                style={{ color: "var(--color-primary)", flexShrink: 0 }}
                              />
                            )}
                            <Link
                              href={`/routines/${routine.id}`}
                              className="text-body-strong no-underline transition-colors truncate"
                              style={{ color: "var(--color-ink)" }}
                            >
                              {routine.name}
                            </Link>
                          </div>
                          {isActive && (
                            <span
                              className="badge text-[10px]"
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
                        <RoutineActions routineId={routine.id} isActive={isActive} />
                      </div>

                      <p className="text-caption line-clamp-2 mb-4" style={{ color: "var(--color-ink-muted)" }}>
                        {routine.description ?? "Sin descripción"}
                      </p>

                      <Link
                        href={`/routines/${routine.id}`}
                        className="btn btn-secondary btn-sm inline-flex w-fit items-center gap-2 no-underline"
                      >
                        Ver detalles
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {archivedRoutines.length > 0 && (
            <section className="grid gap-4">
              <div>
                <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Archivadas</h2>
                <p className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                  Siguen guardadas aquí para restaurarlas cuando quieras.
                </p>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {archivedRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    className="card"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-canvas-muted)",
                      opacity: 0.9,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="badge text-[10px]"
                            style={{
                              background: "var(--color-border)",
                              color: "var(--color-ink-muted)",
                            }}
                          >
                            Archivada
                          </span>
                          <Link
                            href={`/routines/${routine.id}`}
                            className="text-body-strong no-underline transition-colors truncate"
                            style={{ color: "var(--color-ink)" }}
                          >
                            {routine.name}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <p className="text-caption line-clamp-2 mb-4" style={{ color: "var(--color-ink-muted)" }}>
                      {routine.description ?? "Sin descripción"}
                    </p>

                    <ArchivedRoutineActions routineId={routine.id} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
