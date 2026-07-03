export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;

export function toKg(lbs: number, step = 0.5): number {
  return Math.round((lbs * LB_TO_KG) / step) * step;
}

export function toLbs(kg: number, step = 2.5): number {
  return Math.round((kg * KG_TO_LB) / step) * step;
}
