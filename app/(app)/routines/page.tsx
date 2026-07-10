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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>Rutinas</h1>
        <Link
          href="/routines/new"
          className="btn btn-primary btn-sm no-underline flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva Rutina</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      {!hasAnyRoutines ? (
        <div className="card text-center py-16">
          <LayoutList size={48} className="mx-auto mb-4" style={{ color: "var(--color-ink-dimmed)" }} />
          <h2 className="text-body-strong mb-2" style={{ color: "var(--color-ink)" }}>
            No tienes rutinas
          </h2>
          <p className="text-caption mb-6" style={{ color: "var(--color-ink-muted)" }}>
            Crea tu primera rutina para estructurar tu entrenamiento.
          </p>
          <Link href="/routines/new" className="btn btn-primary no-underline inline-flex">
            <Plus size={16} />
            Crear Rutina
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {routines.length > 0 && (
            <section className="grid gap-3">
              <div>
                <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Activas</h2>
                <p className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                  Listas para usar y editar.
                </p>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
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
                        padding: "16px",
                      }}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {isActive && (
                              <Zap
                                size={13}
                                style={{ color: "var(--color-primary)", flexShrink: 0 }}
                              />
                            )}
                            <Link
                              href={`/routines/${routine.id}`}
                              className="text-body-strong no-underline transition-colors"
                              style={{ color: "var(--color-ink)" }}
                            >
                              {routine.name}
                            </Link>
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
                        </div>
                        <RoutineActions routineId={routine.id} isActive={isActive} />
                      </div>

                      <p
                        className="text-caption line-clamp-2 mb-3"
                        style={{ color: "var(--color-ink-muted)" }}
                      >
                        {routine.description ?? "Sin descripción"}
                      </p>

                      {/* CTA — full-width on mobile */}
                      <Link
                        href={`/routines/${routine.id}`}
                        className="btn btn-secondary btn-sm w-full inline-flex items-center justify-center gap-2 no-underline"
                      >
                        Ver y editar
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {archivedRoutines.length > 0 && (
            <section className="grid gap-3">
              <div>
                <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Archivadas</h2>
                <p className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                  Guardadas para restaurar cuando quieras.
                </p>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {archivedRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    className="card"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-canvas-muted)",
                      opacity: 0.85,
                      padding: "16px",
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="badge text-[10px]"
                            style={{
                              background: "var(--color-border)",
                              color: "var(--color-ink-muted)",
                            }}
                          >
                            Archivada
                          </span>
                          <span
                            className="text-body-strong"
                            style={{ color: "var(--color-ink)" }}
                          >
                            {routine.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-caption line-clamp-2 mb-3"
                      style={{ color: "var(--color-ink-muted)" }}
                    >
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
