// Market Acquisition Engine (MAE) — barrel
export * from "./types";
export * from "./interfaces";
export { AcquisitionService } from "./services/acquisition.service";
export {
  registerProvider,
  getProvider,
  listSupportedMethods,
} from "./providers/registry";
