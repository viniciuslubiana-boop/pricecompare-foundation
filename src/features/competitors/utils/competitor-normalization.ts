/**
 * Normalização de dados de concorrentes antes de persistir/comparar.
 * Centraliza regras para qualquer origem (manual, scraping, IA, API, import).
 */

const collapseSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

export function normalizeCompetitorName(input: string | null | undefined): string {
  if (!input) return "";
  return collapseSpaces(String(input));
}

export function normalizeCompetitorNotes(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const v = collapseSpaces(String(input));
  return v.length ? v : null;
}

/**
 * Padroniza URL:
 * - força protocolo (http/https); assume https quando ausente
 * - remove espaços
 * - remove barra final do path raiz
 * - lowercase no host
 */
export function normalizeCompetitorUrl(input: string | null | undefined): string {
  if (!input) return "";
  let raw = String(input).trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  try {
    const u = new URL(raw);
    u.hostname = u.hostname.toLowerCase();
    let result = u.toString();
    // remove a barra final quando for apenas "https://host/"
    if (u.pathname === "/" && !u.search && !u.hash) {
      result = result.replace(/\/$/, "");
    } else if (result.endsWith("/") && !u.search && !u.hash) {
      result = result.replace(/\/$/, "");
    }
    return result;
  } catch {
    return raw;
  }
}

export function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
