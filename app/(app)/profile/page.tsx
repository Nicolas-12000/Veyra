import type { Metadata } from "next";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile, getPhaseHistory } from "@/src/modules/body-weight/services";
import { WeeklyGoalForm } from "@/src/modules/body-weight/components/WeeklyGoalForm";
import { UnitPrefForm } from "@/src/modules/body-weight/components/UnitPrefForm";
import { PhaseHistory } from "@/src/modules/body-weight/components/PhaseHistory";
import { signOut } from "@/src/modules/auth/actions";
import { Target, Settings, History, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function ProfilePage() {
  const userId = await requireUserId();
  const [profile, phaseHistory] = await Promise.all([
    getUserProfile(userId),
    getPhaseHistory(userId),
  ]);

  const unitPref = (profile?.unitPref as "kg" | "lb") ?? "kg";

  return (
    <div className="page-content pb-32">
      <div className="mb-8">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>Perfil</h1>
        <p className="text-body" style={{ color: "var(--color-ink-muted)", marginTop: "2px" }}>
          Gestiona tus preferencias y objetivos
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Phase / Weekly Goal */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <Target size={20} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Objetivo Actual</h2>
          </div>

          <WeeklyGoalForm
            currentPhase={(profile?.currentPhase as "volumen" | "definicion" | "recomposicion") ?? null}
            currentWeeklyChange={
              profile?.targetWeeklyChangeKg ? Number(profile.targetWeeklyChangeKg) : null
            }
          />
        </div>

        {/* Phase History Timeline */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <History size={20} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Historial de Fases</h2>
          </div>

          <PhaseHistory history={phaseHistory} />
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <Settings size={20} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Preferencias</h2>
          </div>

          <div className="space-y-5">
            {/* Unit toggle */}
            <UnitPrefForm currentUnit={unitPref} />

            {/* Data Export */}
            <div
              className="pt-5 mt-5 flex items-center justify-between gap-4 flex-wrap"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="text-body" style={{ color: "var(--color-ink-muted)" }}>Exportar mis datos</p>
                <p className="text-caption mt-0.5" style={{ color: "var(--color-ink-dimmed)" }}>
                  Descarga el historial completo de tus series.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  id="export-csv-btn"
                  href="/api/export/user-data?format=csv"
                  download
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 hover:opacity-85"
                  style={{
                    background: "var(--color-canvas-overlay)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-ink)",
                  }}
                >
                  <Download size={14} />
                  CSV
                </a>
                <a
                  id="export-json-btn"
                  href="/api/export/user-data?format=json"
                  download
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 hover:opacity-85"
                  style={{
                    background: "var(--color-canvas-overlay)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-ink)",
                  }}
                >
                  <Download size={14} />
                  JSON
                </a>
              </div>
            </div>

            {/* Sign out */}
            <form action={signOut} className="pt-5 mt-5" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button
                type="submit"
                className="text-caption transition-colors cursor-pointer"
                style={{ color: "var(--color-danger)" }}
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
