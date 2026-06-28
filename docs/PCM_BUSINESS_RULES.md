# PCM — Regras de Negócio

## Empresas Base
- Máximo de **2 Empresas Base ativas** (enforced via trigger `enforce_max_active_base_companies`).
- Todo veículo de `my_vehicles` pertence obrigatoriamente a uma `base_company_id`.
- Toda comparação/consulta parte de uma Empresa Base.

## Concorrentes
- Representam apenas o mercado público.
- Fontes: site próprio, OLX, Webmotors, Mobiauto, iCarros e similares.
- Google Maps/Places é usado **somente para localizar** concorrentes — nunca para extrair estoque.

## Extraction Engine
- Retry automático até 3 tentativas por página.
- Falha em um concorrente NÃO interrompe a atualização global.
- Logs detalhados em `extraction_logs` (estágios: validation, firecrawl, ai, insert, fatal).

## Comparison Engine
Calcula: menor preço, maior preço, preço médio, posição, qtd. anúncios, links, diff de preço.
- **Nunca altera preços automaticamente.**
- **Nunca recomenda alteração sem solicitação explícita** do usuário.

## Histórico
Guardar sempre: preço, KM, data, fonte, concorrente, URL.
Nunca excluir histórico automaticamente.

## Usuários
- **Administrador**: controle total.
- **Gerente**: operação.
- Roles ficam em `user_roles` (nunca em `profiles`). Checagem via `has_role()` SECURITY DEFINER.

## Consulta Global
Sempre apresenta: meu veículo, mercado consolidado, estatísticas, histórico, links.
Ordenação padrão: menor preço.
