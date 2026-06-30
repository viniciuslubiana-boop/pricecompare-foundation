import type {
  AcquisitionContext,
  ExtractedVehicleDraft,
  NormalizedVehicle,
} from "../types";

/**
 * IDataNormalizer
 * Aplica normalização final (marca, modelo, versão, KM, preço) sobre os
 * drafts extraídos, deixando-os prontos para persistência pelo Engine alvo.
 */
export interface IDataNormalizer {
  normalize(
    drafts: ExtractedVehicleDraft[],
    context: AcquisitionContext,
  ): Promise<NormalizedVehicle[]>;
}
