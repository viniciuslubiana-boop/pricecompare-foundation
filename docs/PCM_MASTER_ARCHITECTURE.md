# PCM — Master Architecture

## Missão
O PCM é uma **Plataforma de Monitoramento Inteligente de Mercado para Revendas de Veículos**.
NÃO é ERP, CRM, DMS, financeiro, oficina, marketplace ou sistema de vendas.

## Engines Oficiais (não criar novos sem necessidade)
1. **Inventory Engine** — `src/features/inventory/` — estoque das Empresas Base.
2. **Competitor Engine** — `src/features/competitors/` — cadastro/normalização de concorrentes.
3. **Extraction Engine** — `src/features/extraction/` — coleta de anúncios públicos (Firecrawl + IA) — uso pontual.
4. **Comparison Engine** — `src/features/comparison/` — comparação Empresa Base ↔ Mercado.
5. **Analytics Engine** — `src/features/analytics/` — métricas, rankings, histórico.
6. **Market Acquisition Engine (MAE)** — `src/features/html-intelligence/` + `src/lib/html-intelligence.functions.ts` — **fluxo oficial** de sincronização de estoques (Empresas Base e Concorrentes). Desde 2026-06-30 (PRD 001 concluído), substitui chamadas ad-hoc ao Extraction Engine para sincronização periódica.


## Regras Arquiteturais
- Toda regra de negócio vive nos Engines.
- Componentes React **apenas apresentam** dados — sem cálculos de negócio.
- Frontend nunca acessa secrets; integrações externas via TanStack server functions / Edge Functions.
- Comparação sempre parte da **Empresa Base selecionada**. Nunca concorrente vs concorrente.

## Stack
TanStack Start v1 (React 19 + Vite 7) · Tailwind v4 · Supabase (Lovable Cloud) · TanStack Query · Zod.

## Camadas
```
UI (routes/components)
  ↓
Hooks (useXxx)
  ↓
Services (xxx.service.ts / xxx.functions.ts)
  ↓
Repositories / Engines
  ↓
Supabase (RLS)
```
