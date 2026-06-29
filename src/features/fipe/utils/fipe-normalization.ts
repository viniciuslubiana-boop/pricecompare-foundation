/**
 * Normalização rigorosa para correlação FIPE.
 * Alinhada ao Comparison Engine — matching estrito por marca + ano,
 * com modelo compatível por tokens (FIPE devolve descrição longa).
 */

const ACCENT_RE = /[\u0300-\u036f]/g;

export function normalizeText(input: string | null | undefined): string {
  if (!input) return "";
  const decimalMarker = "§";
  const separated = input
    .normalize("NFD")
    .replace(ACCENT_RE, "")
    .toLowerCase()
    .replace(/(\d)\.(\d)/g, `$1${decimalMarker}$2`)
    .replace(/([a-z]+)(\d+)/g, "$1 $2")
    .replace(new RegExp(`(\\d+(?:${decimalMarker}\\d+)?)([a-z]+)`, "g"), "$1 $2");

  return separated
    .replace(new RegExp(`[^a-z0-9${decimalMarker} ]+`, "g"), " ")
    .replace(new RegExp(decimalMarker, "g"), ".")
    .replace(/\s+/g, " ")
    .trim();
}

const FIPE_BRAND_ALIASES: Record<string, string> = {
  chevrolet: "GM - Chevrolet",
  "caoa chery": "CAOA CHERY/CHERY",
  bmw: "BMW",
  "bmw motorrad": "BMW MOTORRAD",
};

const FIPE_MODEL_ALIASES: Record<string, string> = {
  "honda|biz ex": "BIZ 125 EX",
  "honda|cb 500 hornet": "CB 500 HORNET",
  "honda|cb 500 f hornet": "CB 500 HORNET",
  "honda|cb 300 f twister abs": "CB 300F TWISTER",
  "honda|cb 300 f twister cbs": "CB 300F TWISTER",
  "honda|cg 160 start": "CG 160 START",
  "honda|cg 160 titan": "CG 160 TITAN",
  "honda|cb 500 x": "CB 500X",
  "honda|cb 1000 r": "CB 1000R ABS",
  "chevrolet|onix 10 mt lt 1": "ONIX HATCH LT 1.0 12V Flex 5p Mec.",
  "gm chevrolet|onix 10 mt lt 1": "ONIX HATCH LT 1.0 12V Flex 5p Mec.",
  "caoa chery|tiggo 8 1.6 tgdi": "TIGGO 8 1.6 TGDI",
  "caoa chery chery|tiggo 8 1.6 tgdi": "TIGGO 8 1.6 TGDI",
  "citroen|c 3 aircross 7": "AIRCROSS7",
  "citroen|c 3 aircross 7 feel 1.0 flex tb 200 aut": "AIRCROSS7 Feel 1.0 Flex TB. 200 Aut.",
  "bmw|x 1 s 20 i": "X1 SDRIVE20I",
  "bmw|x 1 s 20 i active flex": "X1 SDRIVE 20i X-Line 2.0 TB Active Flex",
  "bmw motorrad|x 1 s 20 i": "X1 SDRIVE20I",
  "ford|fiesta sd 1.6 lsea": "Fiesta Sedan 1.6 16V Flex Mec.",
  "byd|dolphin mini gs ev": "Dolphin Mini",
};

const FIPE_MODEL_PREFIX_ALIASES: Array<{
  brand: string;
  prefix: string;
  replacement: string;
}> = [
  { brand: "citroen", prefix: "c 3 aircross 7", replacement: "AIRCROSS7" },
];

export function applyFipeBrandAlias(brand: string): string {
  return FIPE_BRAND_ALIASES[normalizeText(brand)] ?? brand;
}

export function applyFipeModelAlias(brand: string, model: string): string {
  const brandKey = normalizeText(applyFipeBrandAlias(brand));
  const originalBrandKey = normalizeText(brand);
  const modelKey = normalizeText(model);
  const exact =
    FIPE_MODEL_ALIASES[`${originalBrandKey}|${modelKey}`] ??
    FIPE_MODEL_ALIASES[`${brandKey}|${modelKey}`];
  if (exact) return exact;

  const prefixAlias = FIPE_MODEL_PREFIX_ALIASES.find(
    (alias) =>
      (alias.brand === originalBrandKey || alias.brand === brandKey) &&
      (modelKey === alias.prefix || modelKey.startsWith(`${alias.prefix} `)),
  );

  if (prefixAlias) {
    return normalizeText(`${prefixAlias.replacement} ${modelKey.slice(prefixAlias.prefix.length)}`);
  }

  return model;
}

export function normalizeFipeQuery<T extends { brand: string; model: string }>(
  query: T,
): T & { brand_alias_applied: string | null; model_alias_applied: string | null } {
  const brand = applyFipeBrandAlias(query.brand);
  const model = applyFipeModelAlias(query.brand, query.model);
  return {
    ...query,
    brand,
    model,
    brand_alias_applied: brand !== query.brand ? brand : null,
    model_alias_applied: model !== query.model ? model : null,
  };
}

const FUEL_MAP: Record<string, string> = {
  flex: "flex",
  alcool: "alcool",
  álcool: "alcool",
  gasolina: "gasolina",
  diesel: "diesel",
  eletrico: "eletrico",
  elétrico: "eletrico",
  hibrido: "hibrido",
  híbrido: "hibrido",
  gnv: "gnv",
};

export function normalizeFuel(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = normalizeText(input);
  return FUEL_MAP[key] ?? key ?? null;
}

/**
 * Aceita formatos comuns de ano/modelo: 2025, "2025", "2025/2026", "2025-2026".
 * Retorna NaN se não conseguir extrair 4 dígitos iniciais.
 */
export function parseYearModel(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return Math.trunc(value);
  const years = String(value).match(/\d{4}/g);
  if (!years?.length) return NaN;
  return Number(years.at(-1));
}

/** Tokens normalizados, removendo ruído. */
export function tokens(input: string | null | undefined): string[] {
  const t = normalizeText(input).split(" ").filter(Boolean);
  return t;
}

export function tokenCoverage(fipeModel: string, queryModel: string): number {
  const fipe = tokens(fipeModel);
  const query = tokens(queryModel);
  if (!query.length || !fipe.length) return 0;
  const matched = query.filter((q) => fipe.includes(q)).length;
  return matched / query.length;
}

function hasVersionOrDisplacementToken(model: string): boolean {
  const modelTokens = tokens(model);
  return modelTokens.some((t) => /\d/.test(t) || /^[a-z]{2,}\d+[a-z]*$/.test(t));
}

export function containsCompatibleVersionOrDisplacement(
  fipeModel: string,
  queryModel: string,
): boolean {
  const queryNumeric = tokens(queryModel).filter((t) => /\d/.test(t));
  if (!queryNumeric.length) return true;
  const fipe = tokens(fipeModel);
  return queryNumeric.every((q) => fipe.includes(q));
}

function hasMissingAttachedSuffix(fipe: string[], query: string[]): boolean {
  if (!query.length || fipe.length <= query.length) return false;
  const prefixMatches = query.every((q, index) => fipe[index] === q);
  const lastQueryToken = query[query.length - 1];
  const firstExtraToken = fipe[query.length];
  return prefixMatches && /\d/.test(lastQueryToken) && /^[a-z]$/.test(firstExtraToken);
}

export function requiresManualFipeVersion(brand: string, model: string): boolean {
  const brandKey = normalizeText(brand);
  const modelKey = normalizeText(model);
  return brandKey === "toyota" && modelKey === "corolla" && !hasVersionOrDisplacementToken(model);
}

/**
 * Modelo é compatível quando todos os tokens da consulta aparecem no modelo FIPE.
 * Bloqueia falsos positivos óbvios (CB500 ≠ CB500X) porque os tokens precisam casar.
 */
export function isFipeModelCompatible(
  fipeModel: string,
  queryModel: string,
): boolean {
  const fipe = tokens(fipeModel);
  const query = tokens(queryModel);
  if (!query.length || !fipe.length) return false;
  if (hasMissingAttachedSuffix(fipe, query)) return false;
  if (!containsCompatibleVersionOrDisplacement(fipeModel, queryModel)) return false;
  return query.every((q) => fipe.includes(q));
}

/** Comparação estrita por marca+modelo+ano (+combustível) — uso interno. */
export function isStrictFipeMatch(
  a: { brand: string; model: string; year_model: number; fuel?: string | null },
  b: { brand: string; model: string; year_model: number; fuel?: string | null },
): boolean {
  if (normalizeText(a.brand) !== normalizeText(b.brand)) return false;
  if (normalizeText(a.model) !== normalizeText(b.model)) return false;
  if (a.year_model !== b.year_model) return false;
  const fa = normalizeFuel(a.fuel);
  const fb = normalizeFuel(b.fuel);
  if (fa && fb && fa !== fb) return false;
  return true;
}

/**
 * Match aceitável FIPE: marca exata, ano exato, modelo compatível por tokens,
 * combustível compatível quando ambos os lados informam.
 */
export function isAcceptableFipeMatch(
  fipe: { brand: string; model: string; year_model: number; fuel?: string | null },
  query: { brand: string; model: string; year_model: number; fuel?: string | null },
): boolean {
  const normalizedQuery = normalizeFipeQuery(query);
  if (requiresManualFipeVersion(normalizedQuery.brand, normalizedQuery.model)) return false;
  if (normalizeText(fipe.brand) !== normalizeText(normalizedQuery.brand)) return false;
  if (fipe.year_model !== query.year_model) return false;
  if (!isFipeModelCompatible(fipe.model, normalizedQuery.model)) return false;
  const fa = normalizeFuel(fipe.fuel);
  const fb = normalizeFuel(query.fuel);
  if (fa && fb && fa !== fb) return false;
  return true;
}

/** Pega o mês de referência atual no formato YYYY-MM. */
export function currentReferenceMonth(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
