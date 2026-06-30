// Sprint 008 — Auto-recuperação + detecção de queda brusca.
// Funções puras: sem I/O, sem Supabase.

import type { TechnicalPreview } from "../types";

export type AcquisitionMethod =
  | "HTML"
  | "RENDERED_HTML"
  | "EMBEDDED_JSON"
  | "STRUCTURED_DATA"
  | "FILE_IMPORT"
  | "UNKNOWN";

export interface RecoveryInfo {
  initialMethod: AcquisitionMethod;
  finalMethod: AcquisitionMethod;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  recovered: boolean;
}

export interface DropDetectionInput {
  priorAvgVehicles: number | null;
  priorExecutions: number;
  currentVehicles: number;
}

export interface DropDetectionResult {
  suspectedDrop: boolean;
  reason: string | null;
  priorAvgVehicles: number;
}

/**
 * Decide o método final a partir do que o Technical Preview executou.
 * O motor atual já encadeia HTML simples → Firecrawl actions; aqui apenas
 * traduzimos o resultado em método nomeado para o diagnóstico.
 */
export function deriveRecoveryInfo(
  preview: TechnicalPreview | null,
  errorMessage: string | null,
): RecoveryInfo {
  const initialMethod: AcquisitionMethod = "HTML";

  if (!preview) {
    return {
      initialMethod,
      finalMethod: "UNKNOWN",
      fallbackUsed: false,
      fallbackReason: errorMessage ?? "preview indisponível",
      recovered: false,
    };
  }

  // JSON embarcado / schema.org são "promoções de qualidade" — método principal continua HTML/RENDERED_HTML
  const jsonRich = preview.jsonItems > preview.htmlItems;
  let finalMethod: AcquisitionMethod = preview.actionsUsed ? "RENDERED_HTML" : "HTML";
  if (preview.rawAfter === 0 && jsonRich) finalMethod = "EMBEDDED_JSON";

  const fallbackUsed = preview.actionsUsed;
  const success = preview.rawAfter > 0;

  let fallbackReason: string | null = null;
  if (fallbackUsed) {
    if (preview.rawBefore === 0) fallbackReason = "HTML simples retornou 0 itens";
    else if (preview.rawBefore < 6) fallbackReason = `HTML simples retornou poucos itens (${preview.rawBefore})`;
    else fallbackReason = "sinais de scroll/load-more detectados";
  } else if (!success && errorMessage) {
    fallbackReason = errorMessage;
  }

  return {
    initialMethod,
    finalMethod,
    fallbackUsed,
    fallbackReason,
    recovered: fallbackUsed && success,
  };
}

/**
 * Detecta queda brusca de volume comparando com a média histórica.
 * Regra: se média anterior ≥ 20 e atual < 25% da média → suspeito.
 * Também sinaliza quando atual = 0 mas histórico tinha ≥ 10.
 */
export function detectSuddenDrop(input: DropDetectionInput): DropDetectionResult {
  const avg = Math.max(0, Number(input.priorAvgVehicles ?? 0));
  if (input.priorExecutions < 2 || avg <= 0) {
    return { suspectedDrop: false, reason: null, priorAvgVehicles: avg };
  }
  if (input.currentVehicles === 0 && avg >= 10) {
    return {
      suspectedDrop: true,
      reason: `histórico médio de ${Math.round(avg)} veículos, execução atual retornou 0`,
      priorAvgVehicles: avg,
    };
  }
  if (avg >= 20 && input.currentVehicles < avg * 0.25) {
    return {
      suspectedDrop: true,
      reason: `queda de ${Math.round((1 - input.currentVehicles / avg) * 100)}% vs média histórica (${Math.round(avg)})`,
      priorAvgVehicles: avg,
    };
  }
  return { suspectedDrop: false, reason: null, priorAvgVehicles: avg };
}
