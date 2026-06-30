// Smart Source Selector — barrel
export * from "./types";
export type {
  ISourceAnalyzer,
  ISourceValidator,
  ISourceStrategy,
} from "./interfaces";
export { rankCandidates, pickBest, computeSourceQuality } from "./smart-source.engine";
export {
  selectSource,
  recordSourceExecution,
  listSourceHistory,
  listSourceProfiles,
} from "./services/smart-source.functions";
export {
  useSourceHistory,
  useSourceProfiles,
  useSelectSource,
  useRecordSourceExecution,
} from "./hooks/useSmartSource";
