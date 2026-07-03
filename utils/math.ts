export function estimatedOneRepMax(weightKg: number, reps: number): number {
  if (reps === 1) {
    return weightKg;
  }

  return weightKg * (1 + reps / 30);
}

export function calculateVolume(sets: { reps: number; weightKg: number }[]): number {
  return sets.reduce((acc, set) => acc + set.reps * set.weightKg, 0);
}

export function volumeByMuscleGroup(
  sets: { reps: number; weightKg: number; muscleGroup: string }[]
) {
  return sets.reduce<Record<string, number>>((acc, set) => {
    acc[set.muscleGroup] = (acc[set.muscleGroup] ?? 0) +
      set.reps * set.weightKg;
    return acc;
  }, {});
}

export function generateWeightProjection(params: {
  startDate: Date;
  startWeightKg: number;
  weeklyChangeKg: number;
  weeksToProject: number;
}) {
  return Array.from({ length: params.weeksToProject }, (_, index) => ({
    date: new Date(params.startDate.getTime() + index * 7 * 24 * 60 * 60 * 1000),
    projected: params.startWeightKg + params.weeklyChangeKg * index,
    upperBand:
      params.startWeightKg +
      (params.weeklyChangeKg + Math.abs(params.weeklyChangeKg) * 0.3) * index,
    lowerBand:
      params.startWeightKg +
      (params.weeklyChangeKg - Math.abs(params.weeklyChangeKg) * 0.3) * index,
  }));
}

export type PlateauStatus = "progressing" | "slow" | "plateaued" | "regressing";

export function detectPlateau(
  history: { estimated1rm: number; avgRpe: number }[],
  windowWeeks = 3
): PlateauStatus {
  if (history.length < windowWeeks) {
    return "progressing";
  }

  const recent = history.slice(-windowWeeks);
  const first1rm = recent[0].estimated1rm;
  const last1rm = recent[recent.length - 1].estimated1rm;
  const avgRpe = recent.reduce((acc, item) => acc + item.avgRpe, 0) / recent.length;
  const pct = ((last1rm - first1rm) / first1rm) * 100;

  if (pct < -1) {
    return "regressing";
  }

  if (pct < 1.5 && avgRpe >= 8.5) {
    return "plateaued";
  }

  if (pct < 1.5 && avgRpe < 8.5) {
    return "slow";
  }

  return "progressing";
}

export function movingAverage(
  data: { date: Date; weightKg: number }[],
  windowSize = 4
): { date: Date; avg: number }[] {
  return data.map((_, index) => {
    const slice = data.slice(Math.max(0, index - windowSize + 1), index + 1);
    const avg = slice.reduce((acc, item) => acc + item.weightKg, 0) / slice.length;

    return {
      date: data[index].date,
      avg,
    };
  });
}

export function adherenceRate(planned: number, completed: number): number {
  if (planned === 0) {
    return 0;
  }

  return Math.round((Math.min(completed, planned) / planned) * 100);
}

// ── Conversión de Unidades ────────────────────────────────────────────────────

export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;

/** Convierte kg a lb, redondeando al incremento de mancuerna más cercano. */
export function toLbs(kg: number, step = 2.5): number {
  return Math.round((kg * KG_TO_LB) / step) * step;
}

/** Convierte lb a kg, redondeando al incremento más cercano (0.5 kg). */
export function toKg(lbs: number, step = 0.5): number {
  return Math.round((lbs * LB_TO_KG) / step) * step;
}

/** Formatea el peso según la preferencia del usuario. */
export function formatWeight(
  weightKg: number,
  unit: "kg" | "lb",
  decimals = 1
): string {
  const value = unit === "lb" ? toLbs(weightKg) : weightKg;
  return `${value.toFixed(decimals)} ${unit}`;
}

// ── Filtro de Período ─────────────────────────────────────────────────────────

export type PeriodCode = "4w" | "3m" | "6m" | "1y" | "all";

/**
 * Convierte un código de período a la fecha de inicio.
 * Retorna null para 'all' (sin filtro de fecha).
 */
export function periodToStartDate(period: PeriodCode): Date | null {
  const now = new Date();
  switch (period) {
    case "4w": {
      const d = new Date(now);
      d.setDate(d.getDate() - 28);
      return d;
    }
    case "3m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case "6m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case "1y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    case "all":
      return null;
    default:
      return periodToStartDate("3m");
  }
}

// ── Fechas Relativas ──────────────────────────────────────────────────────────

/** Formatea una fecha como relativa ("Hace 3 días", "Hace 2 semanas"). */
export function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "Nunca";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 14) return "Hace 1 semana";
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 60) return "Hace 1 mes";
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

