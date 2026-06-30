// HIE — Pós-normalização (Sprint 005)
// Aplica regras PCM + Catálogo Mestre + aliases aprovados aos
// veículos retornados pela IA, define status final e observações.

import {
  normalizeBrand,
  normalizeKm,
  normalizeModel,
  normalizePrice,
  normalizeYearModel,
} from "@/features/inventory/utils/inventory-normalization";
import type {
  NormalizationStatus,
  NormalizedVehiclePreview,
  PostNormalizationResult,
} from "../types";

const CURRENT_YEAR = new Date().getFullYear();

export interface CatalogEntry {
  brand: string;
  canonical_model: string;
}
export interface AliasEntry {
  brand: string;
  alias: string;
  canonical: string;
}

function norm(s: string | null | undefined): string {
  return (s ?? "").toString().trim().toLowerCase();
}

function average(c: NormalizedVehiclePreview["confidence"]): number {
  const vals = [
    c.brand, c.model, c.version, c.year_model,
    c.km, c.price, c.source_url, c.image_url,
  ];
  const sum = vals.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  return Math.round(sum / vals.length);
}

function isValidUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

export function applyPostNormalization(
  rawItems: NormalizedVehiclePreview[],
  catalog: CatalogEntry[],
  aliases: AliasEntry[],
): PostNormalizationResult {
  const canonicalSet = new Set(
    catalog.map((c) => `${norm(c.brand)}|${norm(c.canonical_model)}`),
  );
  const aliasMap = new Map<string, string>();
  for (const a of aliases) {
    aliasMap.set(`${norm(a.brand)}|${norm(a.alias)}`, a.canonical);
  }

  const seen = new Set<string>();
  const items: NormalizedVehiclePreview[] = rawItems.map((raw) => {
    const observations: string[] = [];
    const brand = normalizeBrand(raw.brand);
    let model = normalizeModel(raw.model);
    const version = raw.version ? normalizeModel(raw.version) : null;
    const yearModel = normalizeYearModel(raw.year_model);
    const km = raw.km != null ? normalizeKm(raw.km) : null;
    const price = raw.price != null ? normalizePrice(raw.price) : null;

    // Catálogo + aliases
    const key = `${norm(brand)}|${norm(model)}`;
    if (canonicalSet.has(key)) {
      observations.push("Modelo canônico");
    } else if (aliasMap.has(key)) {
      const canonical = aliasMap.get(key)!;
      observations.push(`Alias aplicado: ${model} → ${canonical}`);
      model = canonical;
    } else if (brand && model) {
      observations.push("Modelo sem catálogo");
    }

    // Validações
    const errors: string[] = [];
    if (!brand) errors.push("marca ausente");
    if (!model) errors.push("modelo ausente");
    const yearNum = Number((yearModel.split("/").pop() ?? "0"));
    if (!yearNum || yearNum < 1950 || yearNum > CURRENT_YEAR + 1) {
      errors.push("ano inválido");
    }
    if (price == null || price <= 0) errors.push("preço inválido");
    if (price != null && price > 0 && price < 1_000) errors.push("preço suspeito");
    if (km != null && km < 0) errors.push("km inválido");
    if (raw.source_url && !isValidUrl(raw.source_url)) errors.push("link inválido");

    const confidenceAvg = average(raw.confidence);

    let status: NormalizationStatus;
    if (errors.length > 0 || confidenceAvg < 70) status = "invalid";
    else if (confidenceAvg >= 90) status = "approved";
    else status = "review";

    // Duplicidade dentro do mesmo preview
    const dedupKey = `${norm(brand)}|${norm(model)}|${yearNum}|${km ?? ""}|${price ?? ""}`;
    if (seen.has(dedupKey)) {
      status = "duplicated";
      observations.push("Duplicado no preview");
    } else {
      seen.add(dedupKey);
    }

    if (errors.length > 0) observations.push(...errors);

    return {
      ...raw,
      brand,
      model,
      version,
      year_model: yearModel,
      km,
      price,
      confidenceAvg,
      status,
      observations,
    };
  });

  const statusCounts: Record<NormalizationStatus, number> = {
    approved: 0, review: 0, invalid: 0, duplicated: 0,
  };
  let confidenceSum = 0;
  for (const it of items) {
    statusCounts[it.status]++;
    confidenceSum += it.confidenceAvg;
  }
  const confidenceAvg = items.length ? Math.round(confidenceSum / items.length) : 0;

  return { items, statusCounts, confidenceAvg };
}
