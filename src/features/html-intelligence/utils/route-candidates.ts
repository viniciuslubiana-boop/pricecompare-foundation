// Rotas-alvo padrão investigadas automaticamente pelo HIE.
// Mantemos a lista curta e de alta precisão para evitar requisições desnecessárias.

export const INVENTORY_ROUTE_CANDIDATES: readonly string[] = [
  "/",
  "/estoque",
  "/veiculos",
  "/veículos",
  "/seminovos",
  "/usados",
  "/carros",
  "/motos",
  "/inventory",
  "/listagem",
  "/search",
  "/busca",
  "/comprar",
  "/ofertas",
];

export function buildCandidateUrls(baseUrl: string): { path: string; url: string }[] {
  const u = new URL(baseUrl);
  const origin = `${u.protocol}//${u.host}`;
  const seen = new Set<string>();
  const out: { path: string; url: string }[] = [];
  for (const p of INVENTORY_ROUTE_CANDIDATES) {
    const path = p === "/" ? "/" : p;
    const full = path === "/" ? `${origin}/` : `${origin}${path}`;
    if (seen.has(full)) continue;
    seen.add(full);
    out.push({ path, url: full });
  }
  return out;
}
