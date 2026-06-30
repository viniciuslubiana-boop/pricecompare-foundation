# PCM — Roadmap

## Versão Atual (1.0)

- Autenticação + RBAC (`admin`, `gerente`).
- 6 Engines oficiais: Inventory, Competitor, Extraction, Comparison, Analytics e **Market Acquisition Engine (MAE)**.
- **PRD 001 — Market Acquisition Engine — CONCLUÍDO (2026-06-30):** fluxo oficial de sincronização de estoques (Empresas Base e Concorrentes), com descoberta de rota, Inventory/HTML/Source Score, detecção HTML, Firecrawl Actions, IA normalizadora, confidence por campo, fieldCoverage, deduplicação, salvamento por destino, pós-processamento, proteção contra queda brusca, override admin, diagnóstico ao vivo e aprendizado por fonte.
- Empresas Base (até 2) com escopo obrigatório em comparações.
- Atualizar Mercado, Comparação Inteligente, Radar, Estratégia de Preço, Visão 360°.
- Histórico, Movimentações, Monitor de Mercado, Alterações de Mercado.
- Consulta Global e Central de Consulta de Mercado.
- Localizador de Concorrentes (Google Places).
- Importação CSV/XLSX/PDF para Empresa Base e Concorrentes.
- Integração com APIs externas de estoque (server-side, com SSRF guard).
- Dashboard Executivo com DashboardService, useDashboardData, drill-down,
  filtros globais, blocos colapsáveis/favoritáveis, persistência por usuário.
- Sincronização automática via Supabase Realtime.
- Exportação básica PDF/Excel do resumo do Dashboard.


## Versão 1.1 (próxima)

- Exportação completa multi-bloco do Dashboard (PDF/Excel com gráficos).
- Cards de saúde do sistema (status de extração, falhas recentes, fila).
- Agendamento automático de Atualizar Mercado.
- Alertas configuráveis (Δ preço, nova entrada de concorrente).
- Melhorias de UX no Wizard de Importação (preview avançado).

## Versão 2.0

- Multi-tenant real (múltiplas revendas isoladas).
- Mais de 2 Empresas Base por tenant (configurável).
- Catálogo de marca/modelo/versão normalizado (FIPE-like).
- Histórico granular com séries temporais e previsão.
- API pública versionada para clientes do PCM.

## Versão Enterprise

- SSO (SAML) e provisionamento SCIM.
- Auditoria avançada e relatórios regulatórios.
- SLA, multi-região, fila dedicada de scraping.
- Conector nativo para principais DMS do mercado.
- Whitelabel.

## Fora de Escopo (permanente)

- Vendas, financeiro, oficina, leads, marketplace, CRM, ERP.
  Estes domínios não pertencem ao PCM — integrações com terceiros, sim;
  reimplementação, não.
