/**
 * Resolve um caminho de propriedade aninhada em um objeto.
 * Suporta notação ponto (a.b.c) e índices ([0]).
 */
export function getByPath(obj: unknown, path: string | undefined | null): unknown {
  if (!path) return undefined;
  if (obj === null || obj === undefined) return undefined;
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let current: unknown = obj;
  for (const p of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

/** Extrai array de veículos a partir do list_path; se vazio, tenta o root. */
export function extractList(response: unknown, listPath: string): unknown[] {
  let target: unknown = response;
  if (listPath && listPath.trim()) {
    target = getByPath(response, listPath.trim());
  }
  if (Array.isArray(target)) return target;
  // fallback: se a resposta inteira é array
  if (Array.isArray(response)) return response;
  return [];
}
