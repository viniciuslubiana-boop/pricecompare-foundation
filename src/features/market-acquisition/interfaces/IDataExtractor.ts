import type {
  AcquisitionContext,
  ExtractedVehicleDraft,
  RawAcquisitionPayload,
} from "../types";

/**
 * IDataExtractor
 * Transforma o payload bruto retornado por um IDataSourceProvider em uma
 * lista de veículos ainda não normalizados (drafts).
 */
export interface IDataExtractor {
  extract(
    payload: RawAcquisitionPayload,
    context: AcquisitionContext,
  ): Promise<ExtractedVehicleDraft[]>;
}
