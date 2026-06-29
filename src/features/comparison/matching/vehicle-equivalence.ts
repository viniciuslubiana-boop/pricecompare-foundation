/**
 * Vehicle Equivalence — núcleo único e estrito para decidir se dois
 * veículos podem ser comparados.
 *
 * Regras (PCM_ENGINES.md / PCM_BUSINESS_RULES.md):
 *   - Marca: exata.
 *   - Modelo (nome canônico, sem atributos técnicos): exato.
 *   - Ano/Modelo: exato (tolerância só quando explicitamente autorizada).
 *   - Versão / Combustível / Câmbio / Motorização: quando AMBOS têm,
 *     precisam coincidir; quando ausentes em uma das fontes, a
 *     correspondência cai para "confiança alta" (95) em vez de "perfeita" (100).
 *
 * Normalização aplicada exatamente UMA vez por veículo (cache via
 * `prepareVehicle`) para evitar trabalho repetido durante o matching.
 */
import type { CompetitorVehicle, MyVehicle } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

const stripAccents = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function normToken(s: string | null | undefined): string {
  if (!s) return "";
  return stripAccents(String(s).toLowerCase()).replace(/[^a-z0-9]+/g, "");
}

export function normPhrase(s: string | null | undefined): string {
  if (!s) return "";
  return stripAccents(String(s).toLowerCase())
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function yearOf(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = String(s).match(/\d{4}/);
  return m ? m[0] : null;
}

// ---------------------------------------------------------------------------
// Detecção de atributos técnicos
// ---------------------------------------------------------------------------

const FUEL_TOKEN_RE =
  /^(flex|diesel|gasolina|etanol|alcool|hibrido|hibrida|hybrid|eletrico|eletrica|ev|gnv)$/;
const TRANSMISSION_TOKEN_RE =
  /^(cvt|dct|automatico|automatica|aut|manual|mecanico|mecanica|mec)$/;
const ENGINE_RAW_RE = /\b(\d\.\d)\b/;
const TURBO_RE = /\b(turbo|tb)\b/;

function canonicalFuel(t: string): string | null {
  if (!FUEL_TOKEN_RE.test(t)) return null;
  if (t === "hybrid" || t === "hibrida") return "hibrido";
  if (t === "alcool") return "etanol";
  if (t === "ev" || t === "eletrica") return "eletrico";
  return t;
}
function canonicalTransmission(t: string): string | null {
  if (!TRANSMISSION_TOKEN_RE.test(t)) return null;
  if (t.startsWith("aut")) return "automatico";
  if (t.startsWith("mec") || t === "manual") return "manual";
  return t;
}

export interface NormalizedVehicle {
  brand: string;
  /** Nome canônico do modelo, sem atributos técnicos. Ex.: "corolla cross". */
  modelName: string;
  /** Primeira palavra do nome (legado). */
  modelRoot: string;
  /** Modelo completo normalizado (com atributos), espaços colapsados. */
  modelFull: string;
  /** modelName compactado sem espaços — chave estrita de comparação. */
  modelCompact: string;
  year: string | null;
  fuel: string | null;
  transmission: string | null;
  engine: string | null;
  /** Versão deduzida (tokens descritivos após o nome). */
  version: string | null;
}

const cache = new WeakMap<object, NormalizedVehicle>();

export function prepareVehicle(v: MyVehicle | CompetitorVehicle): NormalizedVehicle {
  const cached = cache.get(v as object);
  if (cached) return cached;

  const brand = normToken(v.brand);

  // Motor é detectado no texto bruto (preserva o ponto de "1.0"/"2.0").
  const rawModel = stripAccents(String(v.model ?? "").toLowerCase());
  const rawVersionCol = stripAccents(
    String((v as { version?: string | null }).version ?? "").toLowerCase(),
  );
  const rawAux = `${rawModel} ${rawVersionCol}`;
  const engineMatch = rawAux.match(ENGINE_RAW_RE);
  const engine = engineMatch
    ? `${engineMatch[1]}${TURBO_RE.test(rawAux) ? "t" : ""}`
    : null;

  // Quebra o modelo em tokens e separa nome canônico × atributos × versão.
  const modelPhrase = normPhrase(v.model);
  const tokens = modelPhrase.split(" ").filter(Boolean);
  let fuel: string | null = null;
  let transmission: string | null = null;
  const nameTokens: string[] = [];
  const versionTokens: string[] = [];
  for (const t of tokens) {
    if (t === "turbo" || t === "tb") continue;
    const f = canonicalFuel(t);
    if (f) {
      fuel = fuel ?? f;
      continue;
    }
    const tr = canonicalTransmission(t);
    if (tr) {
      transmission = transmission ?? tr;
      continue;
    }
    if (/^\d+$/.test(t)) {
      // dígitos órfãos (provenientes de "1.0" depois da normalização)
      versionTokens.push(t);
      continue;
    }
    // Token alfanumérico com pelo menos uma letra → parte do nome do modelo.
    if (/[a-z]/.test(t)) {
      nameTokens.push(t);
    } else {
      versionTokens.push(t);
    }
  }
  const modelName = nameTokens.join(" ");
  const modelCompact = modelName.replace(/\s+/g, "");
  const modelRoot = nameTokens[0] ?? "";

  const versionFromColumn = normPhrase(
    (v as { version?: string | null }).version ?? null,
  );
  const versionFromText = versionTokens.join(" ").trim();
  const version = versionFromColumn || versionFromText || null;

  const out: NormalizedVehicle = {
    brand,
    modelName,
    modelRoot,
    modelFull: modelPhrase,
    modelCompact,
    year: yearOf(v.year_model),
    fuel,
    transmission,
    engine,
    version,
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
  yearTolerance?: number;
  requireVersion?: boolean;
}

/** Compara um atributo opcional. Retorna o motivo de descarte quando diverge,
 *  e indica se a comparação foi "parcial" (um lado ausente). */
function compareOptional<T>(
  a: T | null,
  b: T | null,
): { mismatch: boolean; missing: boolean } {
  if (a && b) return { mismatch: a !== b, missing: false };
  // exatamente um ausente
  return { mismatch: false, missing: (!!a) !== (!!b) };
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
  if (!a.modelCompact || !b.modelCompact || a.modelCompact !== b.modelCompact) {
    reasons.push("model");
  }

  const tol = Math.max(0, opts.yearTolerance ?? 0);
  let yearPartial = false;
  if (!a.year || !b.year) {
    reasons.push("year");
  } else {
    const diff = Math.abs(Number(a.year) - Number(b.year));
    if (diff > tol) reasons.push("year");
    else if (diff !== 0) yearPartial = true;
  }

  let missingSecondary = false;
  const fuel = compareOptional(a.fuel, b.fuel);
  if (fuel.mismatch) reasons.push("fuel");
  if (fuel.missing) missingSecondary = true;
  const trans = compareOptional(a.transmission, b.transmission);
  if (trans.mismatch) reasons.push("transmission");
  if (trans.missing) missingSecondary = true;
  const eng = compareOptional(a.engine, b.engine);
  if (eng.mismatch) reasons.push("engine");
  if (eng.missing) missingSecondary = true;

  const ver = compareOptional(a.version, b.version);
  if (ver.mismatch) {
    if (opts.requireVersion) reasons.push("version");
    else missingSecondary = true;
  }
  if (ver.missing) missingSecondary = true;

  if (reasons.length > 0) {
    return { equivalent: false, confidence: 0, reasons };
  }

  let confidence = 100;
  if (missingSecondary) confidence = 95;
  if (yearPartial) confidence = Math.min(confidence, 80);
  return { equivalent: true, confidence, reasons: [] };
}

export function isEquivalent(
  me: MyVehicle | CompetitorVehicle,
  other: MyVehicle | CompetitorVehicle,
  opts?: EquivalenceOptions,
): boolean {
  return evaluateEquivalence(me, other, opts).equivalent;
}
