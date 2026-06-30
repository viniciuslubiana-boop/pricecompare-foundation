// HTML Intelligence Engine (HIE) — barrel
export * from "./types";
export { INVENTORY_ROUTE_CANDIDATES, buildCandidateUrls } from "./utils/route-candidates";
export { scoreHtml, estimateVehiclesFromBreakdown } from "./utils/html-score";
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
