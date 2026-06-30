import { SourceMethod, type SourceCandidate, type SourceProfileRow, type SourceQuality, type SourceHistoryRow } from "./types";

/**
 * Heurísticas default usadas quando nenhum perfil cadastrado serve.
 * Mantém o sistema operável mesmo sem seeds.
 */
const DEFAULT_FALLBACK: Omit<SourceCandidate, "technology">[] = [
  { method: SourceMethod.HTML, priority: 40, confidence: 40, reason: "fallback-default" },
  { method: SourceMethod.RENDERED_HTML, priority: 35, confidence: 35, reason: "fallback-default" },
  { method: SourceMethod.SITEMAP, priority: 30, confidence: 30, reason: "fallback-default" },
  { method: SourceMethod.FILE_IMPORT, priority: 10, confidence: 20, reason: "fallback-manual" },
];

export function rankCandidates(
  technology: string,
  profiles: SourceProfileRow[],
): SourceCandidate[] {
  const matching = profiles
    .filter((p) => p.active && p.technology === technology)
    .map<SourceCandidate>((p) => ({
      method: p.source_method,
      priority: p.priority,
      confidence: Number(p.confidence),
      technology,
      reason: "profile",
    }));

  const ranked = matching.length > 0
    ? matching
    : DEFAULT_FALLBACK.map((c) => ({ ...c, technology }));

  // Ordena por prioridade desc, depois confiança desc.
  return [...ranked].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.confidence - a.confidence;
  });
}

export function pickBest(
  technology: string,
  profiles: SourceProfileRow[],
): { chosen: SourceCandidate; fallbackChain: SourceCandidate[] } {
  const ranked = rankCandidates(technology, profiles);
  const [chosen, ...rest] = ranked;
  return { chosen, fallbackChain: rest };
}

/**
 * Indicador "Qualidade da Fonte" derivado do histórico recente.
 */
export function computeSourceQuality(history: SourceHistoryRow[]): {
  quality: SourceQuality;
  successRate: number;
  avgTimeMs: number;
  avgVehicles: number;
  samples: number;
} {
  if (history.length === 0) {
    return { quality: "indefinida", successRate: 0, avgTimeMs: 0, avgVehicles: 0, samples: 0 };
  }
  const samples = history.length;
  const successes = history.filter((h) => h.success).length;
  const successRate = successes / samples;
  const avgTimeMs =
    history.reduce((acc, h) => acc + (h.execution_time_ms ?? 0), 0) / samples;
  const avgVehicles =
    history.reduce((acc, h) => acc + h.vehicles_found, 0) / samples;

  let quality: SourceQuality = "ruim";
  if (successRate >= 0.9 && avgVehicles >= 20 && avgTimeMs < 8000) quality = "excelente";
  else if (successRate >= 0.75 && avgVehicles >= 10) quality = "boa";
  else if (successRate >= 0.5) quality = "regular";

  return { quality, successRate, avgTimeMs, avgVehicles, samples };
}
