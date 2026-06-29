# PCM — Dashboard Executivo / Centro de Inteligência de Mercado

## Princípios

- A tela do Dashboard **não calcula nada**. Consome exclusivamente o `DashboardService` via `useDashboardData`.
- Toda regra fica nos Engines (especialmente Analytics e Comparison).
- Atualização automática via Supabase Realtime (`useRealtimeSync`) + invalidate por mutações.

## Arquitetura

```text
Engines (Analytics, Comparison, Inventory, Competitor)
        │
        ▼
dashboard.service.ts (facade — agrega tudo)
        │
        ▼
useDashboardData(baseCompanyId)   ── única fonte de dados da UI
        │
        ▼
routes/_authenticated/index.tsx
  ├── DashboardFiltersBar
  ├── DashboardBlock "Visão Geral"
  ├── DashboardBlock "Competitividade"
  ├── DashboardBlock "Mercado"
  └── DashboardBlock "Operação"
```

Arquivos canônicos:
- `src/features/dashboard/services/dashboard.service.ts`
- `src/features/dashboard/hooks/useDashboardData.ts`
- `src/features/dashboard/widgets/{DashboardBlock,DashboardFiltersBar,MetricCard,...}.tsx`
- `src/features/dashboard/drilldowns/{Position,Inventory,Competitors}DrillDown.tsx`
- `src/features/dashboard/preferences/{types.ts,usePreferences.ts}`
- `src/features/dashboard/utils/export.ts`

## Blocos Oficiais

1. **Visão Geral** — KPIs principais (veículos monitorados, concorrentes, comparações).
2. **Competitividade** — % competitividade, diferenciais, oportunidades, ranking.
3. **Mercado** — Δ médio, distribuição de preço, alterações recentes.
4. **Operação** — saúde do sistema, últimas atualizações, falhas de extração.

Cada bloco é colapsável, favoritável e respeita `user_dashboard_preferences`.

## Drill-down

Todo KPI relevante abre um `DrillDownDrawer` (Sheet lateral) com as linhas que compõem o número (posição no mercado, inventário, concorrentes).

## Filtros Globais

`DashboardFiltersBar` aplica:
- Empresa Base
- Período (7d / 30d / 90d / tudo)
- Marca, Modelo, Concorrente
- Cidade, UF

Filtros são persistidos em `user_dashboard_preferences` (por usuário, via RLS `auth.uid()`).

## Persistência

Tabela `user_dashboard_preferences`:
- `base_company_id`, `filters`, `layout`, `favorites`, `collapsed`, `hidden`
- Gravação debounced (500 ms) via `usePreferences.ts`.

## Sincronização Automática

`useRealtimeSync` (montado em `src/routes/_authenticated/route.tsx`) escuta canais Realtime e invalida `dashboardKeys` quando dados mudam — o usuário vê atualização sem refresh.

## Exportação

`utils/export.ts` gera **PDF (jspdf)** e **Excel (xlsx)** do resumo atual + filtros aplicados. A exportação completa multi-bloco está prevista para versão futura (ver `PCM_ROADMAP.md`).
