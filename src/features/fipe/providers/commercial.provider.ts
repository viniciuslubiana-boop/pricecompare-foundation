import type { FipeProvider } from "./fipe.provider";
import type { FipeQuoteQuery, FipeQuoteResult } from "../types/fipe.types";

/**
 * Provedor FIPE Comercial — placeholder.
 * A chave deve ser configurada via Supabase Secret `FIPE_COMMERCIAL_API_KEY`
 * e a URL via app_settings.fipe_provider.commercial.base_url.
 * Implementação real será adicionada quando o provedor for contratado.
 */
export class CommercialProvider implements FipeProvider {
  readonly id = "commercial" as const;

  async quote(_query: FipeQuoteQuery): Promise<FipeQuoteResult | null> {
    // Placeholder intencional. Nunca expor chaves no front-end.
    // Para ativar: ler process.env.FIPE_COMMERCIAL_API_KEY e implementar fetch.
    return null;
  }
}
