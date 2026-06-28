# PCM — Integrações Externas

Toda integração externa passa por **server-side seguro** (TanStack server functions ou Supabase Edge Functions). Chaves NUNCA no frontend.

## Integrações ativas
| Integração | Onde | Secret |
|---|---|---|
| Firecrawl (scraping) | `src/features/extraction/services/extraction.functions.ts` | `FIRECRAWL_API_KEY` |
| Lovable AI Gateway | `src/lib/ai-gateway.server.ts` | `LOVABLE_API_KEY` |
| Google Places (localizador) | `src/features/competitors/services/places.functions.ts` | `GOOGLE_MAPS_API_KEY` |
| APIs externas de estoque | `src/features/api-integrations/services/api-integrations.functions.ts` | por integração (`api_integrations.auth_header_value`) |

## Requisitos para toda nova integração
1. **Teste de conexão** disponível na UI.
2. **Logs persistidos** (tabela `*_logs`) com status, duração, HTTP, payload resumido.
3. **Retry** automático (até 3x para falhas transitórias).
4. **Timeout** configurado.
5. **Tratamento de erro** tipado — nunca vazar erro cru do provedor.

## Proibições
- API Keys / Service Role / Tokens / OpenAI Keys / Google Keys no frontend.
- Acesso direto a serviços externos a partir do bundle client.
- Uso de `supabaseAdmin` (service role) para leituras normais — só para operações privilegiadas.
