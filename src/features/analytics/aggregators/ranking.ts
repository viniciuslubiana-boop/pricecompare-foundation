import type { RankingEntry } from "../types/analytics.types";

export interface RankableItem {
  key: string | null | undefined;
  price?: number | null;
}

export function buildRanking(items: RankableItem[], limit = 10): RankingEntry[] {
  const map = new Map<string, { count: number; priceSum: number; priceCount: number }>();
  for (const it of items) {
    const key = (it.key ?? "").trim();
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0, priceSum: 0, priceCount: 0 };
    cur.count += 1;
    if (typeof it.price === "number") {
      cur.priceSum += it.price;
      cur.priceCount += 1;
    }
    map.set(key, cur);
  }
  const entries: RankingEntry[] = Array.from(map.entries()).map(([key, v]) => ({
    key,
    count: v.count,
    avgPrice: v.priceCount ? v.priceSum / v.priceCount : null,
  }));
  entries.sort((a, b) => b.count - a.count);
  return entries.slice(0, limit);
}
