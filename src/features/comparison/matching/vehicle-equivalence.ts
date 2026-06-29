/**
 * Vehicle Equivalence — núcleo único e estrito para decidir se dois
 * veículos podem ser comparados.
 *
 * Regras (PCM_ENGINES.md / PCM_BUSINESS_RULES.md):
 *   - Marca: exata.
 *   - Modelo: exato (após normalização agressiva).
 *   - Ano/Modelo: exato (tolerância só quando explicitamente autorizada).
 *   - Versão / Combustível / Câmbio / Motorização: quando ambos têm,
 *     precisam coincidir. Caso ausente em uma das fontes, marcamos a
 *     correspondência como "confiança alta" (95) em vez de "perfeita" (100).
 *
 * Normalização aplicada exatamente UMA vez por veículo (cache via
 * `prepareVehicle`) para não duplicar trabalho durante o matching.
 */
import type { CompetitorVehicle, MyVehicle } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

const stripAccents = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** lower + sem acento + sem caracteres não alfanuméricos (remove espaços, hífen, ponto). */
export function normToken(s: string | null | undefined): string {
  if (!s) return "";
  return stripAccents(String(s).toLowerCase()).replace(/[^a-z0-9]+/g, "");
}

/** lower + sem acento + colapsa espaços (mantém estrutura de palavras). */
export function normPhrase(s: string | null | undefined): string {
  if (!s) return "";
  return stripAccents(String(s).toLowerCase()).replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

export function yearOf(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = String(s).match(/\d{4}/);
  return m ? m[0] : null;
}

// ---------------------------------------------------------------------------
// Detecção de atributos secundários a partir do texto do modelo
// (versão/combustível/câmbio/motorização). my_vehicles não possui colunas
// dedicadas; extraímos heurísticamente sem alterar o schema.
// ---------------------------------------------------------------------------

const FUEL_PATTERNS: Array<[RegExp, string]> = [
  [/\bflex\b/, "flex"],
  [/\bdiesel\b/, "diesel"],
  [/\bgasolina\b/, "gasolina"],
  [/\betanol\b|\balcool\b/, "etanol"],
  [/\bhibrid[oa]\b|\bhybrid\b/, "hibrido"],
  [/\beletric[oa]\b|\bev\b/, "eletrico"],
  [/\bgnv\b/, "gnv"],
];

const TRANSMISSION_PATTERNS: Array<[RegExp, string]> = [
  [/\bcvt\b/, "cvt"],
  [/\bdct\b/, "dct"],
  [/\baut(omatico|omatica|o|m)?\b|\baut\b/, "automatico"],
  [/\bmanual\b|\bmec(anico|anica)?\b/, "manual"],
];

/** "1.0", "2.0", "1.5", "1.0 turbo" → "1.0" / "1.0t" */
function detectEngine(s: string): string | null {
  const m = s.match(/\b(\d\.\d)\b/);
  if (!m) return null;
  const base = m[1];
  return /\bturbo\b|\btb\b/.test(s) ? `${base}t` : base;
}

function detectFromPatterns(s: string, table: Array<[RegExp, string]>): string | null {
  for (const [re, val] of table) if (re.test(s)) return val;
  return null;
}

export interface NormalizedVehicle {
  brand: string;
  /** Modelo "raiz" — primeira palavra significativa do modelo (ex.: "corolla", "cb500"). */
  modelRoot: string;
  /** Modelo completo normalizado, espaços colapsados (ex.: "corolla cross"). */
  modelFull: string;
  /** Modelo compactado sem espaços para comparação estrita ("corollacross"). */
  modelCompact: string;
  year: string | null;
  fuel: string | null;
  transmission: string | null;
  engine: string | null;
  /** Versão deduzida (tudo após o modelRoot, sem combustível/câmbio/motor). */
  version: string | null;
}

const cache = new WeakMap<object, NormalizedVehicle>();

export function prepareVehicle(v: MyVehicle | CompetitorVehicle): NormalizedVehicle {
  const cached = cache.get(v as object);
  if (cached) return cached;

  const brand = normToken(v.brand);
  const modelPhrase = normPhrase(v.model);
  const modelTokens = modelPhrase.split(" ").filter(Boolean);
  const modelRoot = modelTokens[0] ?? "";
  const modelCompact = modelPhrase.replace(/\s+/g, "");

  // Texto auxiliar inclui modelo + (version se a tabela tiver, ex.: competitor_vehicles)
  const versionFromColumn = (v as { version?: string | null }).version ?? null;
  const auxText = `${modelPhrase} ${normPhrase(versionFromColumn)}`.trim();

  const fuel = detectFromPatterns(auxText, FUEL_PATTERNS);
  const transmission = detectFromPatterns(auxText, TRANSMISSION_PATTERNS);
  const engine = detectEngine(auxText);

  // version derivada = tokens após o modelRoot, removendo termos já capturados
  const versionTokens = modelTokens
    .slice(1)
    .filter((t) => !/^\d\.\d$/.test(t) && t !== "turbo" && t !== "tb")
    .filter((t) => !FUEL_PATTERNS.some(([re]) => re.test(t)))
    .filter((t) => !TRANSMISSION_PATTERNS.some(([re]) => re.test(t)));
  const versionFromText = versionTokens.join(" ").trim() || null;
  const version = normPhrase(versionFromColumn) || versionFromText;

  const out: NormalizedVehicle = {
    brand,
    modelRoot,
    modelFull: modelPhrase,
    modelCompact,
    year: yearOf(v.year_model),
    fuel,
    transmission,
    engine,
    version: version ? version : null,
  };
  cache.set(v as object, out);
  return out;
}

// ---------------------------------------------------------------------------
// Equivalência / confiança
// ---------------------------------------------------------------------------

export type IncompatibilityReason =
  | "brand"
  | "model"
  | "year"
  | "fuel"
  | "transmission"
  | "engine"
  | "version";

export interface EquivalenceResult {
  equivalent: boolean;
  confidence: number; // 0..100
  reasons: IncompatibilityReason[];
}

export interface EquivalenceOptions {
  /** Tolerância em anos (config "Comparação Flexível/Personalizada"). 0 = estrito. */
  yearTolerance?: number;
  /** Quando true, versão divergente vira motivo de descarte. */
  requireVersion?: boolean;
}

export function evaluateEquivalence(
  me: MyVehicle | CompetitorVehicle,
  other: MyVehicle | CompetitorVehicle,
  opts: EquivalenceOptions = {},
): EquivalenceResult {
  const a = prepareVehicle(me);
  const b = prepareVehicle(other);
  const reasons: IncompatibilityReason[] = [];

  if (!a.brand || !b.brand || a.brand !== b.brand) reasons.push("brand");
  // Modelo: comparação estrita pelo modelo completo compactado.
  if (!a.modelCompact || !b.modelCompact || a.modelCompact !== b.modelCompact) {
    reasons.push("model");
  }

  // Ano
  const tol = Math.max(0, opts.yearTolerance ?? 0);
  if (!a.year || !b.year) {
    reasons.push("year");
  } else {
    const diff = Math.abs(Number(a.year) - Number(b.year));
    if (diff > tol) reasons.push("year");
  }

  // Atributos secundários — só descartam quando AMBOS estão presentes e diferem.
  let missingSecondary = false;
  for (const key of ["fuel", "transmission", "engine"] as const) {
    const va = a[key];
    const vb = b[key];
    if (va && vb) {
      if (va !== vb) reasons.push(key as IncompatibilityReason);
    } else if (!va || !vb) {
      missingSecondary = true;
    }
  }

  // Versão
  if (a.version && b.version) {
    if (a.version !== b.version) {
      if (opts.requireVersion) reasons.push("version");
      else missingSecondary = true;
    }
  } else {
    missingSecondary = true;
  }

  if (reasons.length > 0) {
    return { equivalent: false, confidence: 0, reasons };
  }

  // confiança
  let confidence = 100;
  if (missingSecondary) confidence = 95;
  if (a.year && b.year && a.year !== b.year) confidence = Math.min(confidence, 80);

  return { equivalent: true, confidence, reasons: [] };
}

export function isEquivalent(
  me: MyVehicle | CompetitorVehicle,
  other: MyVehicle | CompetitorVehicle,
  opts?: EquivalenceOptions,
): boolean {
  return evaluateEquivalence(me, other, opts).equivalent;
}
