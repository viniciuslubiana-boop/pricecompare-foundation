# PCM — Módulo Relatórios

> **Status:** Spec oficial. Implementação obrigatoriamente alinhada a `PCM_MASTER_ARCHITECTURE.md` e `PCM_ENGINES.md`.

## 1. Propósito

O módulo **Relatórios** entrega um **comparativo consolidado de mercado** ("Minha Loja → Mercado") em formato exportável (PDF e Excel), reutilizando exclusivamente os engines existentes. Não introduz lógica de negócio nova.

## 2. Fonte de Dados (somente Engines existentes)

| Bloco do relatório | Engine / Service consumido |
| --- | --- |
| Sumário executivo | `analyticsService.getExecutiveSummary(baseCompanyId)` |
| Estatísticas de comparação | `analyticsService.getComparisonStatistics()` derivado de `comparisons` |
| Indicadores de mercado | `analyticsService.getMarketIndicators(baseCompanyId)` |
| Competitividade | `analyticsService.getMarketIndicators` (`competitivenessLevel`) |

Proibido: consultas SQL diretas, cálculos no componente, novas tabelas.

## 3. Escopo (parametrização)

- **Empresa Base** (opcional). Quando informada, filtra o estoque considerado. Quando omitida, agrega todas.
- **Período** (opcional, default `30d`). Reaproveita `DashboardFilters.period` apenas para rotulagem do relatório (filtros temporais ficam a cargo dos engines no futuro).

## 4. Saídas

- **PDF** via `jspdf` + `jspdf-autotable` (já presentes).
- **Excel** via `xlsx` (já presente).
- Os exportadores são reutilizados de `src/features/dashboard/utils/export.ts` (`exportDashboardToPDF` / `exportDashboardToExcel`), pois o formato de sumário é idêntico.

## 5. Estrutura de arquivos

```
src/features/reports/
  services/reports.service.ts   # facade: monta DashboardSummary a partir de analyticsService
  hooks/useReportSummary.ts     # TanStack Query
src/routes/_authenticated/relatorios.tsx
```

## 6. Regras de UI

- A tela usa `PageHeader` padrão e segue a identidade PCM (sem cores novas, sem tokens fora do design system).
- Seletor de Empresa Base (`useBaseCompanies`).
- Pré-visualização do sumário em cards somente-leitura (KPIs já existentes).
- Dois botões: **Exportar PDF** e **Exportar Excel**.
- Sem persistência: relatório é sempre gerado on-demand a partir do estado atual dos engines.

## 7. Segurança

Nenhuma rota nova no backend. Toda leitura passa pelo `analyticsRepository` existente, sujeito às RLS já auditadas. Sem `service_role`, sem service-side function nova.
