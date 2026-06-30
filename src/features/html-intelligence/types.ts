// HTML Intelligence Engine (HIE) — types
// Mini-Sprint 4A: descoberta de rotas + HTML Score.

export interface HtmlScoreBreakdown {
  vehicleHits: number;
  priceHits: number;
  imageHits: number;
  linkHits: number;
  yearHits: number;
  mileageHits: number;
  cardLikeContainers: number;
  structuredData: number;
  /** 0–100 */
  score: number;
}

export interface InventoryRouteCandidate {
  path: string;
  url: string;
  status: number | null;
  reachable: boolean;
  htmlLength: number;
  breakdown: HtmlScoreBreakdown | null;
  vehiclesEstimated: number;
  error?: string | null;
}

export interface RouteDiscoveryResult {
  baseUrl: string;
  chosen: InventoryRouteCandidate | null;
  candidates: InventoryRouteCandidate[];
  processingMs: number;
}

export interface HtmlIntelligenceRunRow {
  id: string;
  base_url: string;
  chosen_route: string | null;
  chosen_score: number;
  candidates: InventoryRouteCandidate[];
  vehicles_estimated: number;
  processing_ms: number;
  executed_by: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
