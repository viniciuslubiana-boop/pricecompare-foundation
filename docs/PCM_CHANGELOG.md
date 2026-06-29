# PCM — Changelog

Toda nova funcionalidade deve registrar uma entrada aqui (Data · Responsável · Objetivo · Arquivos · Impacto · Pendências).

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
