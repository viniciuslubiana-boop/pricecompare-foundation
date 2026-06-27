/**
 * Vehicle 360° filters/sort — puro, sem cálculo de negócio.
 */
import type {
  Vehicle360CompetitorEntry,
  Vehicle360Filters,
} from "../types/comparison.types";

export function applyVehicle360Filters(
  rows: Vehicle360CompetitorEntry[],
  filters: Vehicle360Filters,
  myKm: number | null,
): Vehicle360CompetitorEntry[] {
  const term = filters.versionTerm?.trim().toLowerCase() ?? "";
  const city = filters.city?.trim().toLowerCase() ?? "";
  const maxKm = filters.maxKmDistance ?? null;

  let out = rows.filter((r) => {
    if (term && !r.model.toLowerCase().includes(term)) return false;
    if (city && (r.city ?? "").toLowerCase() !== city) return false;
    if (maxKm != null && myKm != null && r.km != null) {
      if (Math.abs(r.km - myKm) > maxKm) return false;
    }
    return true;
  });

  const sort = filters.sort ?? "price";
  if (sort === "price") {
    out = [...out].sort((a, b) => a.price - b.price);
  } else if (sort === "km") {
    out = [...out].sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
  } else if (sort === "date") {
    out = [...out].sort((a, b) => +new Date(b.lastCollectedAt) - +new Date(a.lastCollectedAt));
  }
  return out;
}
