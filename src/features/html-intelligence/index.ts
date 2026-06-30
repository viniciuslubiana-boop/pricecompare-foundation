// HTML Intelligence Engine (HIE) — barrel
export * from "./types";
export { INVENTORY_ROUTE_CANDIDATES, buildCandidateUrls } from "./utils/route-candidates";
export { scoreHtml, estimateVehiclesFromBreakdown } from "./utils/html-score";
export { computeSourceScore } from "./utils/source-score";
export type { SourceScoreBreakdown, SourceScoreInput } from "./utils/source-score";
export {
  discoverInventoryRoutes,
  assertSafeUrl,
} from "./services/html-intelligence.engine";
export { runTechnicalPreview } from "./services/technical-preview.engine";
export {
  detectVehicleCards,
  detectPagination,
  detectLoadMore,
  detectInfiniteScroll,
  detectStructuredData,
  detectEmbeddedJson,
} from "./detectors";
export { runAiNormalization } from "./services/ai-normalizer.engine";
export { applyPostNormalization } from "./utils/post-normalize";
export type { CatalogEntry, AliasEntry } from "./utils/post-normalize";

