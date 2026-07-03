import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getExerciseSummaryForPeriod } from "@/src/modules/analytics/services";
import { getLatestWeight } from "@/src/modules/body-weight/services";
import { periodToStartDate, formatWeight } from "@/utils/math";
import {
  TrendingUp,
  Dumbbell,
  Scale,
  Activity,
  ArrowRight,
  Plus,
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

  const [profile, latestWeight, exerciseSummary] = await Promise.all([
    getUserProfile(userId),
    getLatestWeight(userId),
    getExerciseSummaryForPeriod({
      userId,
      periodStart: periodToStartDate("3m"),
    }),
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

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>
          Dashboard
        </h1>
        <p className="text-body" style={{ color: "var(--color-ink-muted)", marginTop: "4px" }}>
          Resumen de los últimos 3 meses
        </p>
      </div>

      {/* Stats Cards Row */}
      <div
        className="grid gap-4 mb-8"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {/* Fase actual */}
        <div className="card-stat-accent">
          <div className="text-label-caps mb-3" style={{ color: "var(--color-ink-muted)" }}>
            Fase actual
          </div>
          <div
            className="text-stat-lg"
            style={{ color: phaseColors[phase] }}
          >
            {phaseLabel[phase]}
          </div>
          {profile?.targetWeeklyChangeKg && (
            <div className="text-caption" style={{ color: "var(--color-ink-dimmed)", marginTop: "8px" }}>
              {Number(profile.targetWeeklyChangeKg) >= 0 ? "+" : ""}
              {Number(profile.targetWeeklyChangeKg).toFixed(2)} kg/sem
            </div>
          )}
        </div>

        {/* Peso corporal */}
        <div className="card-stat">
          <div className="text-label-caps mb-3" style={{ color: "var(--color-ink-muted)" }}>
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
          <Link
            href="/body-weight"
            className="text-caption"
            style={{ color: "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "8px", textDecoration: "none" }}
          >
            Ver historial <ArrowRight size={12} />
          </Link>
        </div>

        {/* Ejercicios activos */}
        <div className="card-stat">
          <div className="text-label-caps mb-3" style={{ color: "var(--color-ink-muted)" }}>
            Ejercicios (3m)
          </div>
          <div className="text-stat-lg" style={{ color: "var(--color-ink)" }}>
            {exerciseSummary.length}
          </div>
          <Link
            href="/analytics"
            className="text-caption"
            style={{ color: "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "8px", textDecoration: "none" }}
          >
            Ver analítica <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3 flex-wrap">
        <Link href="/session" className="btn btn-primary" style={{ textDecoration: "none" }}>
          <Plus size={16} />
          Nueva sesión
        </Link>
        <Link href="/analytics" className="btn btn-secondary" style={{ textDecoration: "none" }}>
          <Activity size={16} />
          Ver progresión
        </Link>
      </div>

      {/* Top Exercises */}
      {topExercises.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>
              Top Ejercicios — 3 meses
            </h2>
            <Link
              href="/analytics"
              className="text-caption"
              style={{ color: "var(--color-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
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
                  <th className="table-header-cell" style={{ textAlign: "right" }}>Volumen</th>
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
                    <td className="table-cell table-cell-mono" style={{ textAlign: "right", color: "var(--color-ink-muted)" }}>
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
        <div
          className="card"
          style={{ textAlign: "center", padding: "48px 24px" }}
        >
          <Dumbbell
            size={48}
            style={{ color: "var(--color-ink-dimmed)", margin: "0 auto 16px" }}
          />
          <h2 className="text-display-sm mb-2" style={{ color: "var(--color-ink)" }}>
            Aún no hay datos
          </h2>
          <p className="text-body" style={{ color: "var(--color-ink-muted)", marginBottom: "24px" }}>
            Registra tu primera sesión para ver el análisis de progresión.
          </p>
          <Link href="/session" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Plus size={16} />
            Iniciar primera sesión
          </Link>
        </div>
      )}
    </div>
  );
}
