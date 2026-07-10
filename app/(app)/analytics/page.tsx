import type { Metadata } from "next";
import { requireUserId } from "@/src/modules/auth/server";
import { getUserProfile } from "@/src/modules/body-weight/services";
import { getExerciseSummaryForPeriodWithPrevious } from "@/src/modules/analytics/services";
import { periodToStartDate, formatWeight, formatRelativeDate, PeriodCode, PlateauStatus } from "@/utils/math";
import { Activity, Dumbbell, Calendar, Info, Filter } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Analítica de Progreso",
};

type SearchParamsShape = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape | Promise<SearchParamsShape>;
}) {
  const userId = await requireUserId();
  const sp = searchParams ? await searchParams : {};

  // Parse and validate filters
  const selectedPeriod = (sp.period ? String(sp.period) : "3m") as PeriodCode;
  const validPeriods: PeriodCode[] = ["4w", "3m", "6m", "1y", "all"];
  const period = validPeriods.includes(selectedPeriod) ? selectedPeriod : "3m";

  const muscle = sp.muscle ? String(sp.muscle) : "all";
  const status = sp.status ? String(sp.status) : "all";

  const periodStart = periodToStartDate(period);
  const periodEnd = new Date();

  // Fetch user profile and weight unit preference
  const [profile, summaries, adherenceData] = await Promise.all([
    getUserProfile(userId),
    getExerciseSummaryForPeriodWithPrevious({
      userId,
      periodStart,
      periodEnd,
    }),
    (async () => {
      const { getAdherenceData } = await import("@/src/modules/analytics/queries");
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return getAdherenceData({ userId, periodStart: oneYearAgo });
    })(),
  ]);

  const unit = (profile?.unitPref || "kg") as "kg" | "lb";
  const { current, previous } = summaries;

  // Map and compute status/progression
  const items = current.map((currEx) => {
    const prevEx = previous.find((p) => p.exerciseId === currEx.exerciseId);
    let changePct: number | null = null;
    let statusVal: PlateauStatus = "progressing";

    if (prevEx && Number(prevEx.best1rm) > 0) {
      changePct = ((Number(currEx.best1rm) - Number(prevEx.best1rm)) / Number(prevEx.best1rm)) * 100;
      const avgRpe = currEx.avgRpe ? Number(currEx.avgRpe) : 8.0;

      if (changePct < -1) {
        statusVal = "regressing";
      } else if (changePct >= 1.5) {
        statusVal = "progressing";
      } else {
        if (avgRpe >= 8.5) {
          statusVal = "plateaued";
        } else {
          statusVal = "slow";
        }
      }
    }

    return {
      ...currEx,
      changePct,
      status: statusVal,
    };
  });

  // Filter items in memory
  const filteredItems = items.filter((item) => {
    const matchMuscle = muscle === "all" || item.muscleGroup === muscle;
    const matchStatus = status === "all" || item.status === status;
    return matchMuscle && matchStatus;
  });

  // Filter configuration lists
  const periodsList = [
    { label: "4 Semanas", value: "4w" },
    { label: "3 Meses", value: "3m" },
    { label: "6 Meses", value: "6m" },
    { label: "1 Año", value: "1y" },
    { label: "Todo", value: "all" },
  ];

  const musclesList = [
    { label: "Todos los músculos", value: "all" },
    { label: "Pecho", value: "pecho" },
    { label: "Espalda", value: "espalda" },
    { label: "Hombros", value: "hombros" },
    { label: "Bíceps", value: "biceps" },
    { label: "Tríceps", value: "triceps" },
    { label: "Cuádriceps", value: "cuadriceps" },
    { label: "Isquios", value: "isquios" },
    { label: "Glúteos", value: "gluteos" },
    { label: "Pantorrillas", value: "pantorrillas" },
    { label: "Core", value: "core" },
  ];

  const statusesList = [
    { label: "Todos los estados", value: "all" },
    { label: "Progresando", value: "progressing" },
    { label: "Lento", value: "slow" },
    { label: "Estancado", value: "plateaued" },
    { label: "Regresando", value: "regressing" },
  ];

  // Helper to format volume based on preferred unit
  const formatVolume = (volKg: number) => {
    const val = unit === "lb" ? volKg * 2.20462 : volKg;
    return `${Math.round(val).toLocaleString("es")} ${unit}`;
  };

  return (
    <div className="page-content pb-32">
      <div className="mb-6">
        <h1 className="text-display-lg" style={{ color: "var(--color-ink)" }}>Analítica</h1>
        <p className="text-body" style={{ color: "var(--color-ink-muted)", marginTop: "2px" }}>
          Historial y progresión de fuerza
        </p>
      </div>



      {/* Styled filter rows using scrolling chips to keep it highly athletic & responsive */}
      <div className="card mb-6" style={{ padding: "20px 16px" }}>
        <div className="space-y-5">
          {/* Period Filter */}
          <div>
            <span className="text-label-caps block mb-2.5" style={{ color: "var(--color-ink-muted)" }}>Período</span>
            <div className="scroll-x">
              {periodsList.map((p) => {
                const active = period === p.value;
                return (
                  <Link
                    key={p.value}
                    href={`/analytics?period=${p.value}&muscle=${muscle}&status=${status}`}
                    className={`filter-chip no-underline ${active ? "filter-chip-active" : ""}`}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Muscle Group Filter */}
          <div>
            <span className="text-label-caps block mb-2.5" style={{ color: "var(--color-ink-muted)" }}>Grupo Muscular</span>
            <div className="scroll-x">
              {musclesList.map((m) => {
                const active = muscle === m.value;
                return (
                  <Link
                    key={m.value}
                    href={`/analytics?period=${period}&muscle=${m.value}&status=${status}`}
                    className={`filter-chip no-underline ${active ? "filter-chip-active" : ""}`}
                  >
                    {m.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Plateau Status Filter */}
          <div>
            <span className="text-label-caps block mb-2.5" style={{ color: "var(--color-ink-muted)" }}>Estado</span>
            <div className="scroll-x">
              {statusesList.map((s) => {
                const active = status === s.value;
                return (
                  <Link
                    key={s.value}
                    href={`/analytics?period=${period}&muscle=${muscle}&status=${s.value}`}
                    className={`filter-chip no-underline ${active ? "filter-chip-active" : ""}`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {filteredItems.length === 0 ? (
        <div className="card text-center py-16">
          <Activity size={48} className="mx-auto mb-4" style={{ color: "var(--color-ink-dimmed)" }} />
          <h2 className="text-display-sm mb-2" style={{ color: "var(--color-ink)" }}>
            Sin Resultados
          </h2>
          <p className="text-caption mb-6 max-w-[320px] mx-auto" style={{ color: "var(--color-ink-muted)" }}>
            No hay ejercicios que coincidan con los filtros seleccionados en este período.
          </p>
          <Link href="/session" className="btn btn-primary btn-sm no-underline inline-flex">
            Iniciar Entrenamiento
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Adherence Heatmap calendar section */}
          {(() => {
            const { AdherenceHeatmap } = require("@/src/modules/sessions/components/AdherenceHeatmap");
            return <AdherenceHeatmap data={adherenceData} unit={unit} />;
          })()}

          <div className="card" style={{ padding: "16px" }}>
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell size={18} style={{ color: "var(--color-primary)" }} />
              <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Progresión por Ejercicio</h2>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header-cell text-left min-w-[150px]">Ejercicio</th>
                    <th className="table-header-cell text-left">Músculo</th>
                    <th className="table-header-cell text-right">Mejor 1RM</th>
                    <th className="table-header-cell text-right">Cambio (1RM)</th>
                    <th className="table-header-cell text-right">Volumen Total</th>
                    <th className="table-header-cell text-right">Último entrenado</th>
                    <th className="table-header-cell text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.exerciseId} className="table-row">
                      <td className="table-cell">
                        <div className="text-body-strong" style={{ color: "var(--color-ink)" }}>{item.name}</div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-muscle uppercase text-[10px]">{item.muscleGroup}</span>
                      </td>
                      <td className="table-cell table-cell-mono text-right" style={{ color: "var(--color-ink)" }}>
                        {formatWeight(Number(item.best1rm), unit)}
                      </td>
                      <td className="table-cell table-cell-mono text-right">
                        {item.changePct === null ? (
                          <span style={{ color: "var(--color-ink-muted)" }}>N/A</span>
                        ) : (
                          <span style={{ color: item.changePct > 0 ? "var(--color-success)" : item.changePct < 0 ? "var(--color-danger)" : "var(--color-ink-muted)" }}>
                            {item.changePct > 0 ? `↑ +${item.changePct.toFixed(1)}%` : item.changePct < 0 ? `↓ ${item.changePct.toFixed(1)}%` : "0.0%"}
                          </span>
                        )}
                      </td>
                      <td className="table-cell table-cell-mono text-right" style={{ color: "var(--color-ink-muted)" }}>
                        {formatVolume(Number(item.volume))}
                      </td>
                      <td className="table-cell table-cell-mono text-right" style={{ color: "var(--color-ink-muted)" }}>
                        {formatRelativeDate(item.lastTrained)}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${
                          item.status === "progressing" ? "badge-progress" :
                          item.status === "slow" ? "badge-slow" :
                          item.status === "plateaued" ? "badge-plateau" : "badge-regress"
                        }`}>
                          {item.status === "progressing" ? "Progresando" :
                           item.status === "slow" ? "Lento" :
                           item.status === "plateaued" ? "Estancado" : "Regresando"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="block sm:hidden space-y-4">
              {filteredItems.map((item) => (
                <div key={item.exerciseId} className="border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body-strong" style={{ color: "var(--color-ink)" }}>{item.name}</span>
                    <span className="badge badge-muscle uppercase text-[10px]">{item.muscleGroup}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[13px]">
                    <div>
                      <span className="text-caption block" style={{ color: "var(--color-ink-muted)" }}>Mejor 1RM</span>
                      <span className="text-mono font-semibold text-[14px]" style={{ color: "var(--color-ink)" }}>
                        {formatWeight(Number(item.best1rm), unit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-caption block" style={{ color: "var(--color-ink-muted)" }}>Cambio (1RM)</span>
                      <span className="text-mono">
                        {item.changePct === null ? (
                          <span style={{ color: "var(--color-ink-muted)" }}>N/A</span>
                        ) : (
                          <span className="font-semibold" style={{ color: item.changePct > 0 ? "var(--color-success)" : item.changePct < 0 ? "var(--color-danger)" : "var(--color-ink-muted)" }}>
                            {item.changePct > 0 ? `↑ +${item.changePct.toFixed(1)}%` : item.changePct < 0 ? `↓ ${item.changePct.toFixed(1)}%` : "0.0%"}
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-caption block" style={{ color: "var(--color-ink-muted)" }}>Volumen Total</span>
                      <span className="text-mono" style={{ color: "var(--color-ink-muted)" }}>
                        {formatVolume(Number(item.volume))}
                      </span>
                    </div>
                    <div>
                      <span className="text-caption block" style={{ color: "var(--color-ink-muted)" }}>Último entrenado</span>
                      <span className="text-mono" style={{ color: "var(--color-ink-muted)" }}>
                        {formatRelativeDate(item.lastTrained)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1.5 flex items-center justify-between border-t border-dashed" style={{ borderColor: "var(--color-border)" }}>
                      <span className="text-caption" style={{ color: "var(--color-ink-muted)" }}>Estado</span>
                      <span className={`badge ${
                        item.status === "progressing" ? "badge-progress" :
                        item.status === "slow" ? "badge-slow" :
                        item.status === "plateaued" ? "badge-plateau" : "badge-regress"
                      }`}>
                        {item.status === "progressing" ? "Progresando" :
                         item.status === "slow" ? "Lento" :
                         item.status === "plateaued" ? "Estancado" : "Regresando"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info notice about estimation */}
      <div className="card flex items-start gap-3 border-dashed mt-6" style={{ borderColor: "var(--color-border-strong)", padding: "14px" }}>
        <Info size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-ink-muted)" }} />
        <div>
          <h4 className="text-body-strong mb-1 text-[14px]" style={{ color: "var(--color-ink)" }}>Cálculo de Progresión y Mesetas</h4>
          <p className="text-caption" style={{ color: "var(--color-ink-muted)", lineHeight: "1.4" }}>
            El 1RM estimado se calcula usando la fórmula de Epley: Carga × (1 + Reps / 30).
            La comparación se realiza respecto al período de tiempo equivalente anterior.
            El estancamiento se activa si la mejora del 1RM es menor al 1.5% y el esfuerzo percibido (RPE) promedio de las últimas series ha sido superior a 8.5.
          </p>
        </div>
      </div>
    </div>
  );
}
