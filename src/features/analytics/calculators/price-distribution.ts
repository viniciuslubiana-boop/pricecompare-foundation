import type {
  CompetitorVehicle,
  MyVehicle,
  PriceBucket,
  PriceDistribution,
} from "../types/analytics.types";

const DEFAULT_BUCKETS: Array<[number, number, string]> = [
  [0, 50_000, "Até R$ 50k"],
  [50_000, 80_000, "R$ 50k–80k"],
  [80_000, 120_000, "R$ 80k–120k"],
  [120_000, 180_000, "R$ 120k–180k"],
  [180_000, 250_000, "R$ 180k–250k"],
  [250_000, Number.POSITIVE_INFINITY, "Acima de R$ 250k"],
];

export function computePriceDistribution(
  mine: MyVehicle[],
  competitor: CompetitorVehicle[],
): PriceDistribution {
  const buckets: PriceBucket[] = DEFAULT_BUCKETS.map(([min, max, label]) => ({
    label,
    min,
    max,
    mine: 0,
    competitor: 0,
  }));
  const place = (price: number | null | undefined, key: "mine" | "competitor") => {
    if (typeof price !== "number") return;
    const b = buckets.find((x) => price >= x.min && price < x.max);
    if (b) b[key] += 1;
  };
  mine.forEach((v) => place(v.price, "mine"));
  competitor.forEach((v) => place(v.price, "competitor"));
  return { buckets };
}
