# Integração por API Externa de Estoque

Permitir cadastrar APIs externas para sincronizar estoque (Meu Estoque ou Concorrente), com execução segura no servidor, normalização e roteamento para o Engine correto.

## 1. Banco de dados (migration)

**Tabela `api_integrations`** (configurações cadastradas pelo usuário):
- `name`, `target_type` (`my_stock` | `competitor`), `base_company_id` (FK opcional), `competitor_id` (FK opcional)
- `url`, `http_method` (`GET`|`POST`), `auth_header_name` (default `Authorization`), `auth_header_value` (token/API key — armazenado no banco com RLS estrita, nunca exposto ao client)
- `extra_headers` (jsonb), `body_template` (jsonb, opcional p/ POST)
- `field_mapping` (jsonb: marca/modelo/versao/ano/km/valor/link/foto → caminhos JSON na resposta, ex.: `vehicles[].price`)
- `frequency` (`manual`|`daily`|`weekly`), `status` (`active`|`inactive`)
- `last_run_at`, timestamps

**Tabela `api_integration_logs`**:
- `integration_id`, `started_at`, `finished_at`, `duration_ms`
- `url_called`, `http_status`, `status` (`success`|`auth_error`|`format_error`|`unavailable`|`empty`|`failed`)
- `vehicles_received`, `vehicles_imported`, `error_message`

RLS: somente `authenticated` lê/escreve; `auth_header_value` nunca é selecionado pelo client — leitura no front omite essa coluna via view `api_integrations_public` (sem o token).

## 2. Servidor (TanStack server functions)

`src/features/api-integrations/services/api-integrations.functions.ts`:
- `listIntegrations` — usa view pública (sem token)
- `createIntegration` / `updateIntegration` / `deleteIntegration` — gravam token no banco
- `testApiConnection({ integrationId })` — faz a chamada HTTP no servidor; retorna `{ ok, status, sample, message }` mapeando: OK, auth_error (401/403), format_error (JSON inválido), unavailable (timeout/5xx), empty (zero veículos)
- `runApiIntegration({ integrationId })` — executa: fetch → valida → aplica `field_mapping` → normaliza (reusa `inventory-normalization` / `extraction.normalizer`) → roteia:
  - `my_stock`: insere/atualiza em `my_vehicles` com `base_company_id`, deduplicação via chave `brand|model|year|vin?`
  - `competitor`: insere em `competitor_vehicles` (mesmo caminho que Extraction Engine usa hoje, com `competitor_id`)
- Grava log em `api_integration_logs`

Tudo via `createServerFn` + `requireSupabaseAuth`. Nada de Edge Function nova — a chamada externa roda no servidor TanStack que já é segura. Token sai do banco só dentro do `.handler()`.

## 3. UI

Nova seção na rota `/configuracoes` (aba "Integração por API"):
- Tabela das integrações cadastradas (nome, tipo, alvo, status, última execução)
- Dialog `ApiIntegrationForm` com todos os campos descritos no prompt, incluindo editor de `field_mapping` (form simples: um input por campo PCM apontando o caminho na resposta, ex.: `data.items[*].brand`)
- Botões por linha: **Testar conexão**, **Atualizar via API**, **Editar**, **Excluir**
- Toasts com mensagens em PT-BR refletindo cada cenário
- Aba "Histórico" lista `api_integration_logs` com status, contagens e tempo

## 4. Integração com fluxos existentes

- Após `runApiIntegration` bem-sucedido, invalida queries de inventory / competitors / analytics para o dashboard refletir.
- Não altera CSV/XLSX nem scraping; usa o mesmo Inventory/Extraction Engine, então deduplicação e normalização continuam idênticas.

## Detalhes técnicos

- `field_mapping` resolve caminhos com util simples (`get(obj, "data.items[*].brand")` retornando array) — sem libs novas.
- Timeout de 20s na chamada externa; `AbortController`.
- Validação Zod nas inputs dos server fns.
- Token nunca é retornado pelo `listIntegrations`; o form de edição mostra placeholder "•••" e só envia novo valor se o usuário digitar.

## Arquivos novos

- migration (tabelas + RLS + view)
- `src/features/api-integrations/{types.ts,services/api-integrations.functions.ts,services/api-integrations.client.ts,hooks/useApiIntegrations.ts,components/ApiIntegrationsSection.tsx,components/ApiIntegrationForm.tsx,components/ApiIntegrationLogs.tsx,utils/field-mapper.ts,utils/normalize-response.ts}`
- update `src/routes/_authenticated/configuracoes.tsx` para incluir a seção
