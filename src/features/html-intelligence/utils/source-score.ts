// HTML Intelligence — Source Score (Mini-Sprint 4C)
// Fórmula determinística. Sem IA. Sem persistência.

import type { TechnicalPreview, HtmlScoreBreakdown, RawVehicleItem } from "../types";

export interface SourceScoreInput {
  htmlBreakdown: HtmlScoreBreakdown | null;
  preview: TechnicalPreview | null;
  vehiclesEstimated: number;
  /** Histórico opcional para componente de estabilidade. */
  prior?: {
    executionsTotal: number;
    executionsSuccess: number;
    avgVehicles: number;
  } | null;
  /** Indica se a execução atual usou método fallback. */
  fallbackUsed?: boolean;
  /**
   * Sprint 013 — proporção (0-1) de itens normalizados aprovados pela IA.
   * Quando alta + sourceScore alto + qualityScore alto, aplica piso ao
   * HTML Score para evitar subestimação quando a rota claramente entrega.
   */
  aiApprovalRate?: number;
}


export interface SourceScoreBreakdown {
  /** 0-100 */
  sourceScore: number;
  coverageScore: number;
  qualityScore: number;
  performanceScore: number;
  stabilityScore: number;
  htmlScore: number;
  successRate: number;
  notes: string[];
}

/**
 * Pondera os 5 eixos da fonte:
 *  - Cobertura (35%): quantos itens brutos vs. estimado e estabilidade do volume.
 *  - Qualidade (30%): completude dos campos críticos.
 *  - Performance (15%): tempo de execução + necessidade de actions.
 *  - Estabilidade (15%): taxa de sucesso histórica.
 *  - HTML Score (5%): sinal estrutural da rota.
 *
 * Penaliza fallback em -8 pts no resultado final.
 */
export function computeSourceScore(input: SourceScoreInput): SourceScoreBreakdown {
  const notes: string[] = [];
  const preview = input.preview;
  const items: RawVehicleItem[] = preview?.preview ?? [];

  // ── Cobertura ────────────────────────────────────────────────
  const raw = preview?.rawAfter ?? 0;
  let coverage = 0;
  if (raw >= 50) coverage = 100;
  else if (raw >= 30) coverage = 85;
  else if (raw >= 15) coverage = 70;
  else if (raw >= 5) coverage = 50;
  else if (raw >= 1) coverage = 25;
  if (preview?.structuredDataDetected) {
    coverage = Math.min(100, coverage + 5);
    notes.push("schema.org presente");
  }
  if ((preview?.embeddedJsonSources.length ?? 0) > 0) {
    coverage = Math.min(100, coverage + 5);
    notes.push("JSON embarcado");
  }

  // ── Qualidade dos campos ─────────────────────────────────────
  const sample = items.slice(0, 30);
  const total = Math.max(sample.length, 1);
  const hasPrice = sample.filter((i) => i.price).length / total;
  const hasYear = sample.filter((i) => i.year).length / total;
  const hasKm = sample.filter((i) => i.km).length / total;
  const hasLink = sample.filter((i) => i.link).length / total;
  const hasImage = sample.filter((i) => i.image).length / total;
  const hasTitle = sample.filter((i) => i.title).length / total;

  const quality =
    sample.length === 0
      ? 0
      : Math.round(
          (hasPrice * 30 +
            hasYear * 18 +
            hasKm * 12 +
            hasLink * 15 +
            hasImage * 10 +
            hasTitle * 15),
        );

  // ── Performance ──────────────────────────────────────────────
  const ms = preview?.processingMs ?? 0;
  let performance = 100;
  if (ms > 25000) performance = 30;
  else if (ms > 15000) performance = 55;
  else if (ms > 8000) performance = 75;
  else if (ms > 4000) performance = 90;
  if (preview?.actionsUsed) {
    performance = Math.max(0, performance - 10);
    notes.push("usou Firecrawl actions");
  }

  // ── Estabilidade ─────────────────────────────────────────────
  const prior = input.prior;
  const successRate = prior && prior.executionsTotal > 0
    ? prior.executionsSuccess / prior.executionsTotal
    : raw > 0
      ? 1
      : 0;
  let stability = Math.round(successRate * 100);
  if (!prior || prior.executionsTotal < 2) {
    stability = Math.min(stability, raw > 0 ? 60 : 0); // ainda sem amostra
    notes.push("estabilidade preliminar");
  }

  // ── HTML Score (calculado em 4A) + piso pós-validação (Sprint 013) ──
  let htmlScore = input.htmlBreakdown?.score ?? 0;
  const approvalRate = input.aiApprovalRate ?? 0;
  const provisionalSource =
    coverage * 0.35 + quality * 0.3 + performance * 0.15 + stability * 0.15 + htmlScore * 0.05;
  if (provisionalSource >= 70 && approvalRate >= 0.8 && quality >= 90 && htmlScore < 70) {
    htmlScore = 70;
    notes.push("HTML Score ajustado por validação real (IA aprovou)");
  }

  // ── Source Score ─────────────────────────────────────────────
  let sourceScore =
    coverage * 0.35 +
    quality * 0.3 +
    performance * 0.15 +
    stability * 0.15 +
    htmlScore * 0.05;

  if (input.fallbackUsed) {
    sourceScore = Math.max(0, sourceScore - 8);
    notes.push("fallback aplicado");
  }


  return {
    sourceScore: Math.round(clamp(sourceScore, 0, 100)),
    coverageScore: Math.round(coverage),
    qualityScore: Math.round(quality),
    performanceScore: Math.round(performance),
    stabilityScore: Math.round(stability),
    htmlScore: Math.round(htmlScore),
    successRate: Number(successRate.toFixed(4)),
    notes,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
