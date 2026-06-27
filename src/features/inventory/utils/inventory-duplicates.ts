import type { Vehicle } from "../types/inventory.types";
import {
  normalizeBrand,
  normalizeModel,
  normalizeYearModel,
} from "./inventory-normalization";

const KM_TOLERANCE = 5_000; // km
const PRICE_TOLERANCE_RATIO = 0.05; // 5%

export interface DuplicateCandidate {
  vehicle: Vehicle;
  reasons: string[];
}

/**
 * Detecta veículos prováveis duplicados em relação ao candidato informado.
 * Não bloqueia: apenas retorna candidatos para exibir aviso ao usuário.
 */
export function findDuplicates(
  candidate: {
    brand: string;
    model: string;
    year_model: string;
    km: number;
    price: number;
  },
  existing: Vehicle[],
  options?: { excludeId?: string },
): DuplicateCandidate[] {
  const brand = normalizeBrand(candidate.brand);
  const model = normalizeModel(candidate.model);
  const year = normalizeYearModel(candidate.year_model);
  const price = Number(candidate.price);
  const km = Number(candidate.km);

  const matches: DuplicateCandidate[] = [];

  for (const v of existing) {
    if (options?.excludeId && v.id === options.excludeId) continue;

    const sameBrand = normalizeBrand(v.brand) === brand;
    const sameModel = normalizeModel(v.model) === model;
    const sameYear = normalizeYearModel(v.year_model) === year;
    if (!(sameBrand && sameModel && sameYear)) continue;

    const reasons: string[] = ["mesma marca, modelo e ano"];

    const otherKm = Number(v.km ?? 0);
    if (Math.abs(otherKm - km) <= KM_TOLERANCE) {
      reasons.push("KM muito próxima");
    }

    const otherPrice = Number(v.price ?? 0);
    const tolerance = Math.max(otherPrice, price) * PRICE_TOLERANCE_RATIO;
    if (tolerance > 0 && Math.abs(otherPrice - price) <= tolerance) {
      reasons.push("preço muito próximo");
    } else if (otherPrice === price) {
      reasons.push("preço idêntico");
    }

    matches.push({ vehicle: v, reasons });
  }

  return matches;
}
