// HTML Intelligence Engine — orquestrador puro (sem I/O Supabase).
// Mini-Sprint 4A: descoberta de rotas + HTML Score.
// Sprint 011: Inventory Score + ranking corrigido + URL informada priorizada.

import { buildCandidateUrls } from "../utils/route-candidates";
import { estimateVehiclesFromBreakdown, scoreHtml } from "../utils/html-score";
import { scoreInventory } from "../utils/inventory-score";
import type { InventoryRouteCandidate, RouteDiscoveryResult } from "../types";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_PARALLEL = 4;


function isPrivateOrBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  )
    return true;
  if (h === "127.0.0.1" || h === "::1" || h === "0.0.0.0") return true;
  const parts = h.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }
  return false;
}

export function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Apenas URLs http(s) são permitidas.");
  }
  if (isPrivateOrBlockedHost(parsed.hostname)) {
    throw new Error("URL aponta para um host interno e foi bloqueada.");
  }
  return parsed;
}

async function fetchCandidate(
  path: string,
  url: string,
): Promise<InventoryRouteCandidate> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "PCM-HtmlIntelligence/1.0",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        path,
        url,
        status: res.status,
        reachable: false,
        htmlLength: text.length,
        breakdown: null,
        vehiclesEstimated: 0,
        error: `HTTP ${res.status}`,
      };
    }
    const breakdown = scoreHtml(text);
    return {
      path,
      url,
      status: res.status,
      reachable: true,
      htmlLength: text.length,
      breakdown,
      vehiclesEstimated: estimateVehiclesFromBreakdown(breakdown),
      error: null,
    };
  } catch (e) {
    return {
      path,
      url,
      status: null,
      reachable: false,
      htmlLength: 0,
      breakdown: null,
      vehiclesEstimated: 0,
      error: e instanceof Error ? e.message : "Erro de rede",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function pump() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, pump);
  await Promise.all(runners);
  return results;
}

/**
 * Descobre a melhor rota de estoque para uma URL base.
 * Não persiste nada — apenas devolve o resultado.
 */
export async function discoverInventoryRoutes(
  rawUrl: string,
): Promise<RouteDiscoveryResult> {
  const startedAt = Date.now();
  const safe = assertSafeUrl(rawUrl);
  const candidates = buildCandidateUrls(safe.toString());

  const results = await runWithConcurrency(
    candidates,
    (c) => fetchCandidate(c.path, c.url),
    MAX_PARALLEL,
  );

  const ranked = [...results].sort((a, b) => {
    const sa = a.breakdown?.score ?? -1;
    const sb = b.breakdown?.score ?? -1;
    if (sb !== sa) return sb - sa;
    return b.vehiclesEstimated - a.vehiclesEstimated;
  });

  const chosen = ranked.find((r) => r.reachable && (r.breakdown?.score ?? 0) > 0) ?? null;

  return {
    baseUrl: safe.toString(),
    chosen,
    candidates: ranked,
    processingMs: Date.now() - startedAt,
  };
}
