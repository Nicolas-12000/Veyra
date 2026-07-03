"use client";

// @ts-ignore
import { ActivityCalendar } from "react-activity-calendar";
import type { AdherenceDay } from "@/src/modules/analytics/queries";
import { formatWeight } from "@/shared/utils/units";
import { Flame, CalendarDays, Percent } from "lucide-react";

type Props = {
  data: AdherenceDay[];
  unit: "kg" | "lb";
};

type ThemeInput = {
  light?: [string, string, string, string, string];
  dark?: [string, string, string, string, string];
};

export function AdherenceHeatmap({ data, unit }: Props) {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const dateMap = new Map<string, AdherenceDay>();
  for (const day of data) {
    dateMap.set(day.date, day);
  }

  const calendarData: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
  const cur = new Date(oneYearAgo);
  
  let totalTrainedDays = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let streakCounter = 0;

  const sortedCompletedDates = data
    .map((d) => d.date)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (sortedCompletedDates.length > 0) {
    let prevDate: Date | null = null;
    for (const dateStr of sortedCompletedDates) {
      const currentDate = new Date(dateStr + "T12:00:00");
      if (prevDate) {
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streakCounter++;
        } else if (diffDays > 1) {
          maxStreak = Math.max(maxStreak, streakCounter);
          streakCounter = 1;
        }
      } else {
        streakCounter = 1;
      }
      prevDate = currentDate;
    }
    maxStreak = Math.max(maxStreak, streakCounter);

    if (prevDate) {
      const diffTime = today.getTime() - prevDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        currentStreak = streakCounter;
      } else {
        currentStreak = 0;
      }
    }
  }

  while (cur <= today) {
    const dateStr = cur.toISOString().split("T")[0];
    const match = dateMap.get(dateStr);
    
    if (match) {
      totalTrainedDays++;
      let level: 1 | 2 | 3 | 4 = 1;
      if (match.volume > 15000) level = 4;
      else if (match.volume > 8000) level = 3;
      else if (match.volume > 3000) level = 2;

      calendarData.push({
        date: dateStr,
        count: 1,
        level,
      });
    } else {
      calendarData.push({
        date: dateStr,
        count: 0,
        level: 0,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  const plannedSessionsPerYear = 156; 
  const adherencePercent = Math.min(100, Math.round((totalTrainedDays / plannedSessionsPerYear) * 100));

  const customTheme: ThemeInput = {
    dark: ["#161922", "#2e345b", "#474f8b", "#5e69ba", "#6B7BFF"],
    light: ["#F5F5F8", "#DCEEB2", "#C5E67A", "#AEDD43", "#4D7A00"],
  };

  return (
    <div className="card space-y-6">
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <CalendarDays style={{ color: "var(--color-primary)" }} size={20} />
        <h2 className="text-display-sm" style={{ color: "var(--color-ink)" }}>Consistencia y Adherencia</h2>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-stat flex flex-col items-center justify-center p-4">
          <Flame className="mb-2" size={20} style={{ color: "var(--color-danger)" }} />
          <span className="text-fine-print uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-dimmed)" }}>Racha Actual</span>
          <span className="text-display-sm font-bold text-metric-sm" style={{ color: "var(--color-ink)" }}>{currentStreak} días</span>
        </div>
        <div className="card-stat flex flex-col items-center justify-center p-4">
          <Flame className="mb-2" size={20} style={{ color: "var(--color-warning)" }} />
          <span className="text-fine-print uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-dimmed)" }}>Racha Máxima</span>
          <span className="text-display-sm font-bold text-metric-sm" style={{ color: "var(--color-ink)" }}>{maxStreak} días</span>
        </div>
        <div className="card-stat flex flex-col items-center justify-center p-4">
          <Percent className="mb-2" size={20} style={{ color: "var(--color-success)" }} />
          <span className="text-fine-print uppercase tracking-wider mb-1" style={{ color: "var(--color-ink-dimmed)" }}>Adherencia</span>
          <span className="text-display-sm font-bold text-metric-sm" style={{ color: "var(--color-ink)" }}>{adherencePercent}%</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="overflow-x-auto py-2 flex justify-center scrollbar-none">
        <div className="min-w-[720px] text-xs" style={{ color: "var(--color-ink-muted)" }}>
          <ActivityCalendar
            data={calendarData}
            theme={customTheme as any}
            labels={{
              months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
              weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
              totalCount: "{{count}} entrenamientos en el último año",
              legend: {
                less: "Menos",
                more: "Más",
              },
            }}
            blockSize={12}
            blockMargin={3}
            fontSize={12}
          />
        </div>
      </div>
    </div>
  );
}
