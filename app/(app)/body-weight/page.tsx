import type { Metadata } from "next";
import { requireUserId } from "@/src/modules/auth/server";
import { getWeeklyMetrics, getUserProfile } from "@/src/modules/body-weight/services";
import { WeightChart } from "@/src/modules/body-weight/components/WeightChart";
import { LogWeightButton } from "@/src/modules/body-weight/components/LogWeightButton";
import { WeightHistoryList } from "@/src/modules/body-weight/components/WeightHistoryList";
import { Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Peso Corporal",
};

export default async function BodyWeightPage() {
  const userId = await requireUserId();
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

  const [metrics, profile] = await Promise.all([
    getWeeklyMetrics(userId, twelveWeeksAgo),
    getUserProfile(userId),
  ]);

  const unit = (profile?.unitPref ?? "kg") as "kg" | "lb";

  return (
    <div className="page-content pb-32">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>Peso Corporal</h1>
          <p className="text-body mt-2" style={{ color: "var(--color-ink-muted)" }}>
            Seguimiento y proyección
          </p>
        </div>
        <LogWeightButton unit={unit} />
      </div>

      {metrics.length === 0 ? (
        <div className="card text-center py-20">
          <Scale size={64} className="mx-auto mb-6" style={{ color: "var(--color-ink-dimmed)" }} />
          <h2 className="text-display-md mb-4" style={{ color: "var(--color-ink)" }}>
            Sin Registros
          </h2>
          <p className="text-body mb-8 max-w-[400px] mx-auto" style={{ color: "var(--color-ink-muted)" }}>
            Comienza a registrar tu peso periódicamente para ver tendencias y proyecciones de tu fase actual.
          </p>
          <LogWeightButton unit={unit} />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Tendencia y Proyección</h2>
              <span className="badge badge-neutral">{unit.toUpperCase()}</span>
            </div>
            <WeightChart
              metrics={metrics}
              phaseStartDate={profile?.phaseStartDate ?? null}
              startingWeightKg={
                profile?.startingWeightKg ? Number(profile.startingWeightKg) : null
              }
              targetWeeklyChangeKg={
                profile?.targetWeeklyChangeKg ? Number(profile.targetWeeklyChangeKg) : null
              }
              unit={unit}
            />
          </div>

          <div className="card">
            <h2 className="text-display-sm mb-6" style={{ color: "var(--color-ink)" }}>Historial Reciente</h2>
            <WeightHistoryList metrics={metrics} unit={unit} />
          </div>
        </div>
      )}
    </div>
  );
}
