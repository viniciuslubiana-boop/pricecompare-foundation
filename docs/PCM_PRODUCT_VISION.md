# PCM — Visão do Produto

## O que o PCM É

O **PCM (PriceCompare / Price Control Monitor)** é uma **Plataforma de Monitoramento Inteligente de Mercado para Revendas de Veículos**.

Sua missão única e permanente:

> Monitorar continuamente o mercado de veículos, consolidar os estoques públicos dos concorrentes e comparar automaticamente com as Empresas Base do cliente, fornecendo inteligência acionável de preço, posicionamento e movimentação.

## O que o PCM NÃO É

- ❌ NÃO é ERP
- ❌ NÃO é CRM
- ❌ NÃO é DMS
- ❌ NÃO é sistema financeiro
- ❌ NÃO é sistema de oficina
- ❌ NÃO é marketplace
- ❌ NÃO é sistema de vendas
- ❌ NÃO é gestor de leads

Qualquer pedido que empurre o produto nessa direção deve ser questionado antes de implementado.

## Pilares

1. **Empresas Base** — até 2 lojas do cliente, sempre como ponto de partida da comparação.
2. **Concorrentes** — lojas do mercado, monitoradas via scraping (Firecrawl + IA) ou importação manual.
3. **Inteligência de Mercado** — comparação, ranking, histórico, alterações, radar e estratégia de preço.
4. **Governança** — RLS, RBAC (admin/gerente), auditoria, segredos somente server-side.

## Usuários

- **Administrador** — controle total, gerencia usuários, integrações e configurações globais.
- **Gerente** — operação diária: estoque, concorrentes, comparações, importações.

## Princípio Editorial do Produto

- O PCM **nunca** altera preços automaticamente.
- O PCM **nunca** recomenda alteração de preço sem solicitação explícita do usuário.
- O PCM **nunca** apaga histórico automaticamente.
