# PCM — Documentação Oficial

Esta pasta é a **Constituição Oficial do PCM**. Toda implementação, correção, refatoração ou melhoria deve consultar estes documentos antes de qualquer alteração. Em caso de conflito entre uma nova solicitação e esta documentação, interrompa a implementação e relate o conflito.

## Índice

| Documento | Tema |
|---|---|
| [PCM_MASTER_ARCHITECTURE.md](./PCM_MASTER_ARCHITECTURE.md) | Arquitetura oficial, camadas, stack |
| [PCM_PRODUCT_VISION.md](./PCM_PRODUCT_VISION.md) | Missão, visão, escopo (e o que o PCM **não** é) |
| [PCM_BUSINESS_RULES.md](./PCM_BUSINESS_RULES.md) | Regras de negócio (Empresas Base, Concorrentes, Comparação) |
| [PCM_DATABASE.md](./PCM_DATABASE.md) | Banco: tabelas, relações, RLS, policies |
| [PCM_ENGINES.md](./PCM_ENGINES.md) | Inventory, Competitor, Extraction, Comparison, Analytics |
| [PCM_DASHBOARD.md](./PCM_DASHBOARD.md) | Dashboard Executivo / Centro de Inteligência |
| [PCM_INTEGRATIONS.md](./PCM_INTEGRATIONS.md) | APIs externas, Firecrawl, Google Maps, AI Gateway |
| [PCM_API_GUIDE.md](./PCM_API_GUIDE.md) | Guia técnico para novas integrações |
| [PCM_SECURITY.md](./PCM_SECURITY.md) | RLS, Auth, segredos, SSRF, RBAC |
| [PCM_DEVELOPMENT_GUIDE.md](./PCM_DEVELOPMENT_GUIDE.md) | Padrões de código, camadas, convenções |
| [PCM_CHANGELOG.md](./PCM_CHANGELOG.md) | Histórico de alterações |
| [PCM_ROADMAP.md](./PCM_ROADMAP.md) | Versões 1.1, 2.0 e Enterprise |

## Regra de Ouro

> *"Esta alteração fortalece a missão de monitorar inteligentemente o mercado para revendas de veículos?"*

Se a resposta não for **sim**, a alteração não pertence ao PCM.

## Processo Obrigatório para Nova Funcionalidade

1. Ler a documentação pertinente em `/docs`.
2. Verificar conflito com a Constituição.
3. Reutilizar Engines, hooks, services, schemas, types e componentes existentes.
4. Implementar mantendo regra de negócio nos Engines.
5. Atualizar a documentação impactada e o `PCM_CHANGELOG.md`.
6. Executar autoauditoria (build, types, RLS, performance, responsividade).
7. Gerar relatório final ao usuário com arquivos criados/alterados e pendências.
