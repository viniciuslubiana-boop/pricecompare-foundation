/**
 * Normalização de campos de veículo antes de persistir ou comparar.
 * Centraliza regras para evitar duplicação entre formulário manual,
 * importação CSV/Excel, smart paste e IA.
 */

const collapseSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

/** "  toyota  " -> "Toyota" */
export function normalizeBrand(input: string | null | undefined): string {
  if (!input) return "";
  const cleaned = collapseSpaces(String(input)).toLowerCase();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** "Corolla   XEi  2.0" -> "Corolla XEi 2.0" */
export function normalizeModel(input: string | null | undefined): string {
  if (!input) return "";
  return collapseSpaces(String(input));
}

/** Aceita "2023", "2022/2023", "2022-2023" -> "2022/2023" */
export function normalizeYearModel(input: string | null | undefined): string {
  if (!input) return "";
  const raw = collapseSpaces(String(input)).replace(/[-.]/g, "/");
  const match = raw.match(/(\d{4})(?:\s*\/\s*(\d{4}))?/);
  if (!match) return raw;
  const [, a, b] = match;
  return b ? `${a}/${b}` : a;
}

/**
 * Aceita "120.000", "120000", "120 km", "120,5" -> number inteiro.
 */
export function normalizeKm(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") return Math.max(0, Math.round(input));
  const cleaned = String(input)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

/**
 * Aceita "R$ 89.900,00", "89900.00", "89.900,5" -> number decimal.
 */
export function normalizePrice(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") return Math.max(0, input);
  const cleaned = String(input).replace(/[^\d,.-]/g, "");
  // Formato brasileiro: ponto = milhar, vírgula = decimal
  const hasComma = cleaned.includes(",");
  const normalized = hasComma
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export function normalizeSupplier(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = collapseSpaces(String(input));
  return v.length ? v : null;
}

export interface NormalizedVehicle {
  brand: string;
  model: string;
  year_model: string;
  km: number;
  price: number;
  supplier_name: string | null;
}

export function normalizeVehicle(input: {
  brand?: string | null;
  model?: string | null;
  year_model?: string | null;
  km?: string | number | null;
  price?: string | number | null;
  supplier_name?: string | null;
}): NormalizedVehicle {
  return {
    brand: normalizeBrand(input.brand),
    model: normalizeModel(input.model),
    year_model: normalizeYearModel(input.year_model),
    km: normalizeKm(input.km),
    price: normalizePrice(input.price),
    supplier_name: normalizeSupplier(input.supplier_name),
  };
}
