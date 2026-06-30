import { AcquisitionMethod } from "../types";
import type { IDataSourceProvider } from "../interfaces";

/**
 * Registry de providers por método de aquisição.
 * Sprint 001: apenas estrutura — providers concretos serão adicionados
 * em sprints futuras (API, JSON, HTML, RENDERED_HTML, FILE_IMPORT).
 */
const providers = new Map<AcquisitionMethod, IDataSourceProvider>();

export function registerProvider(provider: IDataSourceProvider): void {
  providers.set(provider.method, provider);
}

export function getProvider(
  method: AcquisitionMethod,
): IDataSourceProvider | null {
  return providers.get(method) ?? null;
}

export function listSupportedMethods(): AcquisitionMethod[] {
  return Array.from(providers.keys());
}
