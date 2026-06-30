import type {
  AcquisitionContext,
  AcquisitionMethod,
  RawAcquisitionPayload,
} from "../types";

/**
 * IDataSourceProvider
 * Responsável por **buscar** o conteúdo bruto da fonte (API, JSON, HTML,
 * HTML renderizado ou arquivo). Não interpreta nem normaliza dados.
 */
export interface IDataSourceProvider {
  readonly method: AcquisitionMethod;
  supports(context: AcquisitionContext): boolean;
  fetch(context: AcquisitionContext): Promise<RawAcquisitionPayload>;
}
