// Rotas-alvo padrão investigadas automaticamente pelo HIE.
// Sprint 011: aceita uma rota informada pelo usuário (prioridade no ranking).

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

export interface RouteCandidateBuild {
  path: string;
  url: string;
  /** Sprint 011 — true quando a path veio da URL informada pelo usuário. */
  userProvided: boolean;
}

export function buildCandidateUrls(baseUrl: string): RouteCandidateBuild[] {
  const u = new URL(baseUrl);
  const origin = `${u.protocol}//${u.host}`;
  const userPath = u.pathname && u.pathname !== "" ? u.pathname : "/";
  const seen = new Set<string>();
  const out: RouteCandidateBuild[] = [];

  // 1) Sempre adiciona a rota informada pelo usuário PRIMEIRO (com prioridade).
  if (userPath && userPath !== "/") {
    const full = `${origin}${userPath}${u.search ?? ""}`;
    seen.add(full);
    out.push({ path: userPath, url: full, userProvided: true });
  }

  // 2) Depois adiciona o conjunto padrão de candidatos.
  for (const p of INVENTORY_ROUTE_CANDIDATES) {
    const path = p === "/" ? "/" : p;
    const full = path === "/" ? `${origin}/` : `${origin}${path}`;
    if (seen.has(full)) continue;
    seen.add(full);
    out.push({ path, url: full, userProvided: userPath === path });
  }
  return out;
}
