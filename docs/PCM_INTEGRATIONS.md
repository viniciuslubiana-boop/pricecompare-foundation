# PCM — Integrações

Toda integração externa é **server-side** (TanStack `createServerFn` ou Edge Functions). Nenhum segredo no bundle client.

Para o **guia técnico de implementação** (requisitos para novas integrações, logs, retry, timeout), ver [PCM_API_GUIDE.md](./PCM_API_GUIDE.md).

## Integrações Ativas

| Integração | Uso | Arquivo | Secret |
|---|---|---|---|
| **Firecrawl** | Scraping de páginas de concorrentes | `src/features/extraction/services/extraction.functions.ts` | `FIRECRAWL_API_KEY` |
| **Lovable AI Gateway** (Gemini) | Extração estruturada de anúncios + Diagnóstico | `src/lib/ai-gateway.server.ts` | `LOVABLE_API_KEY` |
| **Google Places** | Localizador de concorrentes próximos | `src/features/competitors/services/places.functions.ts` | `GOOGLE_MAPS_API_KEY` |
| **APIs externas de estoque** | Sincronização automática de Empresas Base | `src/features/api-integrations/services/api-integrations.functions.ts` | por integração (`api_integrations.auth_header_value`) |

## Importação Manual

- CSV / XLSX / PDF via `ImportWizard` (`src/features/imports/`).
- Suporta tanto **Empresa Base** quanto **Concorrente**.
- Logs em `import_logs` + dados em `my_vehicles` / `competitor_vehicles`.

## Regras

1. Frontend **nunca** acessa secrets ou serviços externos diretamente.
2. SSRF: `assertSafeUrl` bloqueia loopback, link-local (169.254/16), RFC1918, `.localhost`, `.local`, `.internal`. `redirect: "manual"`.
3. Toda integração precisa de: teste de conexão na UI, logs persistidos, retry (3x), timeout, erro tipado.
4. Google Maps/Places é usado **apenas para localizar** concorrentes — nunca para extrair estoque.

## Domínios Estáveis (webhooks/cron)

- Produção: `project--{project-id}.lovable.app`
- Preview: `project--{project-id}-dev.lovable.app`

Rotas públicas (`/api/public/*`) devem **verificar assinatura/segredo** dentro do handler.
