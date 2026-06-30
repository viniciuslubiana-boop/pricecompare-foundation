# PCM — Changelog

Toda nova funcionalidade deve registrar uma entrada aqui (Data · Responsável · Objetivo · Arquivos · Impacto · Pendências).

## [PRD 001 — Market Acquisition Engine — CONCLUÍDO] — 2026-06-30
- **Status:** homologado em produção. MAE passa a ser o **fluxo oficial** de sincronização de estoques de Empresas Base e Concorrentes (substitui orquestrações ad-hoc anteriores do Extraction Engine para sincronização periódica).
- **Sprints entregues:** 001–013 (Foundation → Site Discovery → SSS → HIE → Source Score → AI Normalizer → Recovery & Security → Homologação → Precision Mode → Extractor Resilience → Ajustes Finos pós-homologação).
- **Funcionalidades oficialmente entregues:**
  - Descoberta automática de rota de inventário (Site Discovery + candidate URLs).
  - **Inventory Score** (estimativa heurística de veículos por rota).
  - **HTML Score** (qualidade técnica do HTML; com piso pós-validação real).
  - **Source Score** (0–100) combinando cobertura, qualidade, performance, estabilidade e HTML.
  - Detecção HTML (cards, paginação, load-more, infinite scroll, structured data, embedded JSON).
  - **Firecrawl Actions** (scroll/click/wait) para conteúdos dinâmicos.
  - **IA Normalizadora** (Lovable AI Gateway — Gemini) com schema rígido.
  - **Confidence por campo** + **fieldCoverage** (brand, model, year, price, km, link, image).
  - Deduplicação contra estoque vigente (Inventory Engine).
  - **Salvamento por destino** (Empresa Base via Inventory Engine · Concorrente via `competitor_vehicles`).
  - **Pós-processamento** automático (Comparison + Analytics + invalidação de cache Dashboard) com alerta de "sem equivalência rígida".
  - **Proteção contra queda brusca** (Data Protection Guard, >5 itens).
  - **Override admin** (server-side, autorizado via `has_role`).
  - **Diagnóstico ao vivo** (`/diagnostico-html`) com telemetria de IA.
  - **Aprendizado por fonte** (`market_source_scores` — histórico de execuções, success rate, média de veículos).
- **Pendências (não bloqueantes):** persistir `fieldCoverage` em coluna dedicada de `html_intelligence_runs` (hoje vai no JSON `technical_preview`); re-sincronizar concorrentes antigos para aplicar aliases de marca no banco; evoluir estimador `html-score` para liberar pisos ≥ 80.



## [Governança v2.0] — 2026-06-29
- Promulgada a **Constituição Oficial PCM v2.0** — documentação completa em `/docs` substitui o antigo Prompt Mestre.
- Documentos novos: `README.md`, `PCM_PRODUCT_VISION.md`, `PCM_ENGINES.md`, `PCM_DASHBOARD.md`, `PCM_INTEGRATIONS.md`, `PCM_SECURITY.md`, `PCM_ROADMAP.md`.
- Documentos mantidos: `PCM_MASTER_ARCHITECTURE.md`, `PCM_BUSINESS_RULES.md`, `PCM_DATABASE.md`, `PCM_DEVELOPMENT_GUIDE.md`, `PCM_API_GUIDE.md`.
- Toda evolução futura deve passar pelo Processo Obrigatório descrito no `README.md`.
- Pendências catalogadas em `PCM_ROADMAP.md` (v1.1: exportação completa multi-bloco, saúde do sistema, alertas).

## [Governança] — 2026-06-28
- Adoção oficial da **Constituição PCM** como documento mestre.
- Criada pasta `/docs` com 6 documentos permanentes:
  - `PCM_MASTER_ARCHITECTURE.md`
  - `PCM_BUSINESS_RULES.md`
  - `PCM_DATABASE.md`
  - `PCM_DEVELOPMENT_GUIDE.md`
  - `PCM_API_GUIDE.md`
  - `PCM_CHANGELOG.md`
- Toda evolução futura deve respeitar a Regra de Ouro: *"Esta alteração fortalece a missão do PCM?"*

## Histórico anterior (resumo)
- Sprints 000–011: fundação, auth/RBAC, 11 tabelas base, CRUD de estoque, Engines (Inventory, Import, Competitor, Extraction, Comparison, Analytics), Dashboard Executivo, Operation Center.
- RC 1.0: auditoria, remoção de `any`, padronização.
- Funcionalidades 01–11: Atualizar Mercado, Comparação Inteligente, Alterações, Radar, Estratégia de Preço, Visão 360°, Movimentações, Monitor, Consulta Global, Localizador de Concorrentes, Histórico, Central de Consulta.
- Loja de Referência + 2 Empresas Base com filtros agrupados.
- Integração por API externa de estoque (segura via server functions).
