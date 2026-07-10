import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getExerciseSummaryForPeriod } from "@/src/modules/analytics/services";
import { getLatestWeight } from "@/src/modules/body-weight/services";
import { getRoutinesForUser } from "@/src/modules/routines/queries";
import { periodToStartDate, formatWeight } from "@/utils/math";
import {
  TrendingUp,
  Dumbbell,
  Scale,
  Activity,
  ArrowRight,
  Plus,
  BookOpen,
  ChevronRight,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    redirect("/login");
  }

  const [profile, latestWeight, exerciseSummary, routines] = await Promise.all([
    getUserProfile(userId),
    getLatestWeight(userId),
    getExerciseSummaryForPeriod({
      userId,
      periodStart: periodToStartDate("3m"),
    }),
    getRoutinesForUser(userId),
  ]);

  const unit = (profile?.unitPref ?? "kg") as "kg" | "lb";
  const phase = profile?.currentPhase ?? "volumen";
  const phaseLabel: Record<string, string> = {
    volumen: "Volumen",
    definicion: "Definición",
    recomposicion: "Recomposición",
  };
  const phaseColors: Record<string, string> = {
    volumen: "var(--color-success)",
    definicion: "var(--color-danger)",
    recomposicion: "var(--color-chart-core)",
  };

  const topExercises = exerciseSummary
    .sort((a, b) => Number(b.best1rm) - Number(a.best1rm))
    .slice(0, 5);

  const activeRoutine = routines.find((r) => r.id === profile?.activeRoutineId) ?? routines[0];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>
          Dashboard
        </h1>
        <p className="text-body" style={{ color: "var(--color-ink-muted)", marginTop: "4px" }}>
          Últimos 3 meses
        </p>
      </div>

      {/* Stats Cards Row */}
      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        {/* Fase actual */}
        <Link
          href="/profile"
          className="card-stat-accent block no-underline"
          style={{ cursor: "pointer" }}
        >
          <div className="text-label-caps mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Fase actual
          </div>
          <div className="text-stat-lg" style={{ color: phaseColors[phase] }}>
            {phaseLabel[phase]}
          </div>
          {profile?.targetWeeklyChangeKg && (
            <div className="text-caption" style={{ color: "var(--color-ink-dimmed)", marginTop: "6px" }}>
              {Number(profile.targetWeeklyChangeKg) >= 0 ? "+" : ""}
              {Number(profile.targetWeeklyChangeKg).toFixed(2)} kg/sem
            </div>
          )}
          <div
            className="text-caption mt-2 inline-flex items-center gap-1"
            style={{ color: "var(--color-ink-dimmed)" }}
          >
            Editar perfil <ChevronRight size={10} />
          </div>
        </Link>

        {/* Peso corporal */}
        <Link
          href="/body-weight"
          className="card-stat block no-underline"
          style={{ cursor: "pointer" }}
        >
          <div className="text-label-caps mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Peso actual
          </div>
          {latestWeight ? (
            <div className="text-stat-lg" style={{ color: "var(--color-ink)" }}>
              {formatWeight(latestWeight, unit)}
            </div>
          ) : (
            <div className="text-body" style={{ color: "var(--color-ink-dimmed)" }}>
              No registrado
            </div>
          )}
          <div
            className="text-caption mt-2 inline-flex items-center gap-1"
            style={{ color: "var(--color-primary)" }}
          >
            Ver historial <ArrowRight size={10} />
          </div>
        </Link>

        {/* Ejercicios activos */}
        <Link
          href="/analytics"
          className="card-stat block no-underline"
          style={{ cursor: "pointer" }}
        >
          <div className="text-label-caps mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Ejercicios (3m)
          </div>
          <div className="text-stat-lg" style={{ color: "var(--color-ink)" }}>
            {exerciseSummary.length}
          </div>
          <div
            className="text-caption mt-2 inline-flex items-center gap-1"
            style={{ color: "var(--color-primary)" }}
          >
            Ver analítica <ArrowRight size={10} />
          </div>
        </Link>
      </div>

      {/* Active Routine Banner */}
      {activeRoutine ? (
        <Link
          href={`/routines/${activeRoutine.id}`}
          className="block no-underline mb-6"
        >
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: "var(--color-primary-subtle)",
              border: "1px solid rgba(107,123,255,0.25)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(107,123,255,0.2)",
                  flexShrink: 0,
                }}
              >
                <Zap size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <div className="text-label-caps mb-0.5" style={{ color: "var(--color-primary)" }}>
                  Rutina activa
                </div>
                <div className="text-body-strong" style={{ color: "var(--color-ink)" }}>
                  {activeRoutine.name}
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          </div>
        </Link>
      ) : (
        <Link
          href="/routines/new"
          className="block no-underline mb-6"
        >
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: "var(--color-canvas-elevated)",
              border: "1px dashed var(--color-border-strong)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-canvas-overlay)",
                  flexShrink: 0,
                }}
              >
                <BookOpen size={16} style={{ color: "var(--color-ink-dimmed)" }} />
              </div>
              <div>
                <div className="text-body-strong" style={{ color: "var(--color-ink)" }}>
                  Sin rutina activa
                </div>
                <div className="text-caption" style={{ color: "var(--color-ink-muted)" }}>
                  Toca para crear tu primera rutina
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--color-ink-dimmed)", flexShrink: 0 }} />
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Link
          href="/session"
          className="btn btn-primary flex-1"
          style={{ textDecoration: "none", minWidth: "140px" }}
        >
          <Plus size={16} />
          Nueva sesión
        </Link>
        <Link
          href="/analytics"
          className="btn btn-secondary"
          style={{ textDecoration: "none" }}
        >
          <Activity size={16} />
          Progresión
        </Link>
        <Link
          href="/body-weight"
          className="btn btn-secondary"
          style={{ textDecoration: "none" }}
        >
          <Scale size={16} />
          Registrar peso
        </Link>
      </div>

      {/* Top Exercises */}
      {topExercises.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>
              Top Ejercicios
            </h2>
            <Link
              href="/analytics"
              className="text-caption inline-flex items-center gap-1"
              style={{ color: "var(--color-primary)", textDecoration: "none" }}
            >
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="table-header-cell" style={{ textAlign: "left" }}>Ejercicio</th>
                  <th className="table-header-cell" style={{ textAlign: "right" }}>Mejor 1RM</th>
                  <th
                    className="table-header-cell mobile-hidden"
                    style={{ textAlign: "right" }}
                  >
                    Volumen
                  </th>
                </tr>
              </thead>
              <tbody>
                {topExercises.map((ex) => (
                  <tr key={ex.exerciseId} className="table-row">
                    <td className="table-cell">
                      <span className="text-body-strong" style={{ color: "var(--color-ink)" }}>
                        {ex.name}
                      </span>
                    </td>
                    <td className="table-cell table-cell-mono" style={{ textAlign: "right" }}>
                      {formatWeight(Number(ex.best1rm), unit)}
                    </td>
                    <td
                      className="table-cell table-cell-mono mobile-hidden"
                      style={{ textAlign: "right", color: "var(--color-ink-muted)" }}
                    >
                      {Math.round(Number(ex.volume)).toLocaleString("es")} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {exerciseSummary.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <Dumbbell
            size={48}
            style={{ color: "var(--color-ink-dimmed)", margin: "0 auto 16px" }}
          />
          <h2 className="text-display-sm mb-2" style={{ color: "var(--color-ink)" }}>
            Aún no hay datos
          </h2>
          <p className="text-body" style={{ color: "var(--color-ink-muted)", marginBottom: "24px" }}>
            Registra tu primera sesión para ver tu análisis de progresión.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Link
              href="/session"
              className="btn btn-primary"
              style={{ textDecoration: "none" }}
            >
              <Plus size={16} />
              Iniciar primera sesión
            </Link>
            <Link
              href="/routines/new"
              className="btn btn-ghost"
              style={{ textDecoration: "none", color: "var(--color-ink-muted)" }}
            >
              O primero crea una rutina →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
