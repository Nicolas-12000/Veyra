export type PeriodKey = "4w" | "3m" | "6m" | "1y" | "all";

export function periodToStartDate(period: PeriodKey): Date | null {
  const now = new Date();

  switch (period) {
    case "4w":
      return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    case "3m":
      return subtractMonths(now, 3);
    case "6m":
      return subtractMonths(now, 6);
    case "1y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "all":
      return null;
    default:
      return subtractMonths(now, 3);
  }
}

function subtractMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() - months);
  return next;
}
