import {
  AcquisitionMethod,
  type AcquisitionContext,
  type AcquisitionRunResult,
} from "../types";
import { getProvider } from "../providers/registry";
import type {
  IDataExtractor,
  IDataNormalizer,
  IDataSourceProvider,
} from "../interfaces";

/**
 * AcquisitionService
 *
 * Orquestrador oficial do Market Acquisition Engine.
 * Une Provider → Extractor → Normalizer em um fluxo único e auditável.
 *
 * Sprint 001: apenas a estrutura. A execução real será implementada
 * em sprints subsequentes (cada método terá Provider/Extractor próprios).
 */
export class AcquisitionService {
  constructor(
    private readonly extractor: IDataExtractor,
    private readonly normalizer: IDataNormalizer,
    private readonly provider?: IDataSourceProvider,
  ) {}

  resolveProvider(method: AcquisitionMethod): IDataSourceProvider | null {
    return this.provider ?? getProvider(method);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(_context: AcquisitionContext): Promise<AcquisitionRunResult> {
    const startedAt = new Date().toISOString();
    // Sprint 001 — sem execução real. Retorna shape padrão.
    return {
      status: "pending",
      vehiclesFound: 0,
      vehiclesSaved: 0,
      errorMessage: null,
      startedAt,
      finishedAt: startedAt,
    };
  }
}
