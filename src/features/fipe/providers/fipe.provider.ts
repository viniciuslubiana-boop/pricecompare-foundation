import type {
  FipeProviderId,
  FipeQuoteQuery,
  FipeQuoteResult,
  FipeQuoteWithDiagnostics,
} from "../types/fipe.types";

/**
 * Contrato comum a todos os provedores FIPE.
 * Toda implementação deve rodar exclusivamente no servidor — nunca no front-end.
 */
export interface FipeProvider {
  readonly id: FipeProviderId;
  /** Retorna a melhor cotação encontrada, ou null se nenhuma correspondência estrita for possível. */
  quote(query: FipeQuoteQuery): Promise<FipeQuoteResult | null>;
  /** Retorna cotação com rastreio de diagnóstico por veículo quando o provedor suportar. */
  quoteWithDiagnostics?(query: FipeQuoteQuery): Promise<FipeQuoteWithDiagnostics>;
}
