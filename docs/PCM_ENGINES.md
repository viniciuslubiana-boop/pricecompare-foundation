# PCM — Engines

Toda regra de negócio do PCM vive nos **5 Engines oficiais**. Componentes React **apenas apresentam** dados.

Não criar novos Engines sem alteração explícita da Constituição.

---

## 1. Inventory Engine
Pasta: `src/features/inventory/`

**Responsabilidade:** estoque das Empresas Base.

- CRUD de `my_vehicles` (escopo obrigatório por `base_company_id`).
- Normalização (marca, modelo, versão, KM, preço).
- Validação (Zod) e detecção de duplicidade.
- Formatadores compartilhados (`inventory-formatters.ts`).

Principais arquivos:
- `services/inventory.service.ts`
- `schemas/inventory.schema.ts`
- `hooks/useInventory.ts`
- `utils/inventory-{normalization,duplicates,validation,formatters}.ts`

---

## 2. Competitor Engine
Pasta: `src/features/competitors/`

**Responsabilidade:** cadastro e normalização de concorrentes.

- CRUD de `competitors`, normalização de URLs e telefones.
- Status (ativo, monitorando, com erro).
- Localizador via Google Places (`places.functions.ts`) — apenas para descobrir lojas, nunca para extrair estoque.

---

## 3. Extraction Engine
Pasta: `src/features/extraction/`

**Responsabilidade:** coletar anúncios públicos.

- Scraping server-side via **Firecrawl** + extração estruturada por **Lovable AI Gateway** (Gemini).
- Retry automático até 3 tentativas por página.
- Falha em um concorrente **não interrompe** a atualização global.
- Logs detalhados em `extraction_logs` por estágio (`validation`, `firecrawl`, `ai`, `insert`, `fatal`).
- Diagnóstico em `/diagnostico-extracao`.

---

## 4. Comparison Engine
Pasta: `src/features/comparison/`

**Responsabilidade:** comparar Empresa Base ↔ Mercado.

Calcula:
- Menor / maior / médio do mercado.
- Posição no ranking.
- Δ de preço e Δ de KM.
- Score de competitividade.
- Recomendações (Radar, Estratégia de Preço — apenas quando solicitadas).

Submódulos:
- `matching/` — matcher e score.
- `calculators/` — preço de mercado, radar, estratégia, mudanças, sumário.
- `services/` — `comparison`, `global-search`, `radar`, `strategy`, `vehicle360`.

Regra absoluta: **nunca concorrente vs concorrente**. Comparação sempre parte da Empresa Base.

---

## 5. Analytics Engine
Pasta: `src/features/analytics/`

**Responsabilidade:** métricas, rankings e séries históricas.

- Centraliza estatísticas (média, mediana, dispersão, ranking).
- Detecção de alterações de mercado (novos, removidos, variação de preço/KM).
- Fornece dados ao **DashboardService**, **Monitor de Mercado**, **Histórico** e **Movimentações**.

---

## Fluxo Geral

```text
Importação / API externa / Scraping
        │
        ▼
Inventory Engine ◄────────── Empresas Base
        │
Extraction Engine ──────────► competitor_vehicles
        │
        ▼
Comparison Engine ──────────► comparações + radar + estratégia
        │
        ▼
Analytics Engine ───────────► métricas, histórico, alterações
        │
        ▼
DashboardService ───────────► useDashboardData ──► UI
```

## Eventos / Sincronização

- Mutações relevantes invalidam `react-query` por chaves padronizadas (`analyticsKeys`, `dashboardKeys`, etc.).
- `useRealtimeSync` (em `_authenticated/route.tsx`) escuta canais Supabase Realtime para invalidar caches globais.
