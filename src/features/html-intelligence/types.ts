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

export interface InventoryScoreSummary {
  score: number;
  realCardSignals: number;
  vehicleLinkHits: number;
  inventoryTermHits: number;
  institutionalNoise: number;
  repeatedStructure: number;
  pathBonus: number;
  homePenalty: number;
  priorityBoost: boolean;
  reasons: string[];
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
  /** Sprint 011 — score específico de "página real de estoque". */
  inventoryScore?: InventoryScoreSummary | null;
  /** Sprint 011 — true quando a URL veio do usuário. */
  priorityBoost?: boolean;
  /** Sprint 011 — quando a rota foi rejeitada pelo ranking, o motivo. */
  rejectionReason?: string | null;
}

export interface RouteDiscoveryResult {
  baseUrl: string;
  chosen: InventoryRouteCandidate | null;
  candidates: InventoryRouteCandidate[];
  processingMs: number;
  /** Sprint 011 — explicação textual da escolha final. */
  chosenReason?: string | null;
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

export interface ExtractorQualitySummary {
  total: number;
  pctPrice: number;
  pctYear: number;
  pctKm: number;
  pctTitle: number;
  pctLink: number;
  pctImage: number;
  qualityScore: number;
  missingFields: string[];
  recommendations: string[];
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
  /** Sprint 011 — qualidade dos itens brutos por campo. */
  quality?: ExtractorQualitySummary | null;
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

// ── Sprint 005: AI Normalization ─────────────────────────────
export type NormalizationStatus = "approved" | "review" | "invalid" | "duplicated";

export interface PerFieldConfidence {
  brand: number;
  model: number;
  version: number;
  year_model: number;
  km: number;
  price: number;
  source_url: number;
  image_url: number;
}

export interface NormalizedVehiclePreview {
  brand: string | null;
  model: string | null;
  version: string | null;
  year_model: string | null;
  km: number | null;
  price: number | null;
  source_url: string | null;
  image_url: string | null;
  store_name: string | null;
  city: string | null;
  source: string;
  confidence: PerFieldConfidence;
  confidenceAvg: number;
  status: NormalizationStatus;
  observations: string[];
}

/** Sprint 011 — Estados de telemetria da IA. Nunca deixar a UI sem feedback. */
export type AiStatus =
  | "idle"
  | "sending"
  | "processing"
  | "success"
  | "timeout"
  | "gateway_error"
  | "invalid_json"
  | "empty_response"
  | "validation_failed"
  | "missing_key";

export interface AiTelemetry {
  status: AiStatus;
  itemsSent: number;
  payloadBytes: number;
  responseBytes: number;
  startedAt: number;
  finishedAt: number;
  errorDetail: string | null;
}

export interface AiNormalizationOutcome {
  items: NormalizedVehiclePreview[];
  aiUsed: boolean;
  aiModel: string | null;
  aiTokens: number;
  aiDurationMs: number;
  errors: string[];
  /** Sprint 011 — telemetria detalhada da chamada à IA. */
  telemetry: AiTelemetry;
}


export interface PostNormalizationResult {
  items: NormalizedVehiclePreview[];
  statusCounts: Record<NormalizationStatus, number>;
  confidenceAvg: number;
}

