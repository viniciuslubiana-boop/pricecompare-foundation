// HTML Intelligence Engine (HIE) — types
// Mini-Sprint 4A: descoberta de rotas + HTML Score.
// Mini-Sprint 4B: detectores + prévia técnica.

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

// ── Mini-Sprint 4B ────────────────────────────────────────────
export type RawItemSource = "HTML" | "JSON" | "STRUCTURED_DATA";

export interface RawVehicleItem {
  title: string | null;
  price: string | null;
  year: string | null;
  km: string | null;
  link: string | null;
  image: string | null;
  rawText: string;
  source: RawItemSource;
  sourcePage: string;
  /** 0–100 técnico (não é confidence de IA) */
  confidence: number;
}

export interface PaginationInfo {
  detected: boolean;
  nextPageUrl: string | null;
  candidates: string[];
}

export interface LoadMoreInfo {
  detected: boolean;
  label: string | null;
}

export interface ScrollInfo {
  detected: boolean;
}

export interface StructuredDataResult {
  detected: boolean;
  items: RawVehicleItem[];
}

export interface EmbeddedJsonResult {
  detected: boolean;
  sources: string[];
  items: RawVehicleItem[];
}

export interface TechnicalPreview {
  routeUrl: string;
  cardsDetected: number;
  jsonItems: number;
  htmlItems: number;
  structuredItems: number;
  actionsUsed: boolean;
  scrollCycles: number;
  loadMoreClicks: number;
  pagination: PaginationInfo;
  loadMore: LoadMoreInfo;
  scroll: ScrollInfo;
  embeddedJsonSources: string[];
  structuredDataDetected: boolean;
  processingMs: number;
  preview: RawVehicleItem[];
  rawBefore: number;
  rawAfter: number;
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
  actions_used?: boolean;
  scroll_cycles?: number;
  load_more_clicks?: number;
  pagination_detected?: boolean;
  embedded_json_detected?: boolean;
  structured_data_detected?: boolean;
  raw_items_found?: number;
  technical_preview?: TechnicalPreview | Record<string, never>;
}
