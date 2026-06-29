/**
 * Normalização rigorosa para correlação FIPE.
 * Alinhada ao Comparison Engine — matching estrito por marca + modelo + ano + combustível.
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

/** Comparação estrita por marca+modelo+ano (+combustível quando ambos têm). */
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

/** Pega o mês de referência atual no formato YYYY-MM. */
export function currentReferenceMonth(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
