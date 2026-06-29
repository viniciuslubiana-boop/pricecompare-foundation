/**
 * Normalização rigorosa para correlação FIPE.
 * Alinhada ao Comparison Engine — matching estrito por marca + ano,
 * com modelo compatível por tokens (FIPE devolve descrição longa).
 */

const ACCENT_RE = /[\u0300-\u036f]/g;

export function normalizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(ACCENT_RE, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const m = String(value).match(/\d{4}/);
  return m ? Number(m[0]) : NaN;
}

/** Tokens normalizados, removendo ruído. */
export function tokens(input: string | null | undefined): string[] {
  const t = normalizeText(input).split(" ").filter(Boolean);
  return t;
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
  if (normalizeText(fipe.brand) !== normalizeText(query.brand)) return false;
  if (fipe.year_model !== query.year_model) return false;
  if (!isFipeModelCompatible(fipe.model, query.model)) return false;
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
