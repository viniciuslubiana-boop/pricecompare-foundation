import type { PriceStats } from "../types/analytics.types";

export function computePriceStats(values: Array<number | null | undefined>): PriceStats {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) {
    return { count: 0, min: null, max: null, avg: null, median: null, sum: 0 };
  }
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    median,
    sum,
  };
}
