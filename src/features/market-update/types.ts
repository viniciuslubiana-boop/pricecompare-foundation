/**
 * Tipos do Market Update Engine — orquestra Competitor, Extraction,
 * Comparison e Analytics em um único fluxo "Atualizar Mercado".
 */

export type MarketUpdateStatus = "running" | "completed" | "partial" | "failed";

export interface CompetitorRunDetail {
  competitorId: string;
  competitorName: string;
  competitorUrl: string;
  status: "completed" | "failed" | "skipped";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  pagesProcessed: number;
  totalPages: number;
  vehiclesFound: number;
  comparisonsCreated: number;
  matches: number;
  opportunities: number;
  differentials: number;
  error?: string | null;
}

export interface MarketUpdateProgress {
  phase:
    | "idle"
    | "loading-competitors"
    | "processing-competitor"
    | "running-comparisons"
    | "finalizing"
    | "done"
    | "error";
  currentCompetitorIndex: number;
  totalCompetitors: number;
  currentCompetitorName: string | null;
  currentPage: number;
  totalPages: number;
  vehiclesFoundCurrent: number;
  elapsedMs: number;
  percent: number;
}

export interface MarketUpdateResult {
  runId: string | null;
  status: MarketUpdateStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  competitorsTotal: number;
  competitorsProcessed: number;
  competitorsFailed: number;
  vehiclesFound: number;
  comparisonsCreated: number;
  matches: number;
  opportunities: number;
  differentials: number;
  details: CompetitorRunDetail[];
  message: string;
}

export interface MarketUpdateRunRow {
  id: string;
  user_id: string | null;
  status: MarketUpdateStatus;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  totals: {
    competitors_total?: number;
    competitors_processed?: number;
    competitors_failed?: number;
    vehicles_found?: number;
    comparisons_created?: number;
    matches?: number;
    opportunities?: number;
    differentials?: number;
  };
  details: CompetitorRunDetail[];
  created_at: string;
}
