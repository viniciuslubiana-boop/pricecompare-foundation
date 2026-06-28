# Duas Empresas Base no Meu Estoque

## Objetivo
Permitir até 2 Empresas Base ativas no PCM, com seletor obrigatório em Meu Estoque, importação, cadastro manual, comparação e dashboard. Concorrentes permanecem globais.

## 1. Banco de dados (migration)

Criar tabela `base_companies`:
- `id`, `name`, `city`, `state`, `website`, `logo_url`
- `type` ('carros' | 'motos' | 'geral')
- `status` ('active' | 'inactive')
- `created_at`, `updated_at`
- GRANT padrão + RLS:
  - SELECT: authenticated
  - INSERT/UPDATE/DELETE: apenas `is_admin(auth.uid())`
- Trigger BEFORE INSERT/UPDATE garantindo no máximo **2** com `status='active'`.

Alterar `my_vehicles`:
- Adicionar `base_company_id uuid REFERENCES base_companies(id) ON DELETE RESTRICT` (nullable inicialmente para backfill).
- Seed: criar 1 empresa default "Empresa Base" usando `referenceStore` em `app_settings` (se houver) e backfill `my_vehicles.base_company_id` para essa empresa.
- Após backfill: `ALTER COLUMN base_company_id SET NOT NULL`.
- Index em `base_company_id`.

Sem mudar políticas existentes de `my_vehicles`; o filtro por empresa fica no aplicativo.

## 2. Camada de dados / serviços

- `src/features/base-companies/types.ts` — tipos `BaseCompany`, `BaseCompanyType`.
- `src/features/base-companies/services/base-companies.service.ts` — CRUD + `listActive()`.
- `src/features/base-companies/hooks/useBaseCompanies.ts` — TanStack Query (`list`, `listActive`, mutations).
- `src/features/base-companies/context/SelectedBaseCompanyContext.tsx` — provider global guardando seleção em `localStorage` (`pcm.selectedBaseCompanyId`). Hook `useSelectedBaseCompany()`.
- Montar provider no `__root.tsx`.

## 3. Configurações
Nova aba "Empresas Base" em `configuracoes.tsx`:
- Lista das empresas com badges de status/tipo.
- Botão "Adicionar empresa" (bloqueado quando já há 2 ativas + toast).
- Form (dialog) com Nome, Cidade, Estado, Site, Tipo, Logo URL, Status.
- Admin: CRUD completo. Gerente: somente leitura.

## 4. Meu Estoque
Em `meu-estoque.tsx`:
- Seletor no topo (`Select`) com empresas ativas. Persistência via contexto.
- Se nenhuma empresa cadastrada: empty state instruindo ir em Configurações.
- `useInventory` e `vehicleRepository.list` recebem `baseCompanyId` no filtro.
- `VehicleFormDialog` inclui campo `Empresa Base` (pré-preenchido com a selecionada, obrigatório).
- Schema Zod: `baseCompanyId` required.

## 5. Importação
Em `ImportWizard.tsx`:
- Step inicial: seletor obrigatório de Empresa Base antes do upload.
- `import.service` injeta `base_company_id` em cada row inserida em `my_vehicles`.
- Bloqueio com toast se nenhuma empresa ativa.

## 6. Comparação / Dashboard / Consulta Global
- `useComparison`, `useDashboard`, `useGlobalSearch`: aceitam `baseCompanyId` (ou "all" no dashboard) e filtram `my_vehicles` por esse campo.
- Dashboard: seletor com "Todas | Empresa 1 | Empresa 2".
- Consulta Global: agrupa resultados de "Meu Estoque" por empresa.
- Comparação: usa empresa selecionada do contexto.

Concorrentes (`competitors`, `competitor_vehicles`) permanecem inalterados — globais.

## 7. Auditoria
`auditService.log` em criar/editar/ativar empresa base, importação (incluir `base_company_id` em `newData`), criação/edição manual de veículo.

## 8. Migração de dados existentes
- Criar empresa "Empresa Base Principal" usando `referenceStore.name` se disponível.
- UPDATE em `my_vehicles` para preencher `base_company_id` com essa empresa.

## Detalhes técnicos
- Trigger PL/pgSQL: `IF NEW.status='active' AND (SELECT count(*) FROM base_companies WHERE status='active' AND id<>NEW.id) >= 2 THEN RAISE EXCEPTION ...`.
- Provider de contexto evita prop drilling do `baseCompanyId`.
- Manter Engines intocados: filtragem por `base_company_id` é feita no repositório (boundary única).
- Não criar campo novo em `competitor_vehicles`.

## Arquivos a criar
- `supabase/migrations/<ts>_base_companies.sql`
- `src/features/base-companies/{types.ts, services/base-companies.service.ts, hooks/useBaseCompanies.ts, context/SelectedBaseCompanyContext.tsx, components/BaseCompanyForm.tsx, components/BaseCompanySelector.tsx, components/BaseCompaniesSection.tsx}`

## Arquivos a alterar
- `src/routes/__root.tsx` (provider)
- `src/routes/_authenticated/configuracoes.tsx` (nova aba)
- `src/routes/_authenticated/meu-estoque.tsx` (seletor + filtro)
- `src/routes/_authenticated/index.tsx` (dashboard seletor)
- `src/features/inventory/{hooks/useInventory.ts, services/inventory.service.ts, schemas/inventory.schema.ts, types/inventory.types.ts, components/VehicleFormDialog.tsx}`
- `src/repositories/vehicle.repository.ts`
- `src/features/imports/{components/ImportWizard.tsx, services/import.service.ts}`
- `src/features/comparison/hooks/{useComparison.ts, useGlobalSearch.ts}` + serviços que consomem `my_vehicles`
- `src/features/dashboard/hooks/useDashboard.ts`

## Pendências aceitas
- Histórico/Monitor antigos ficam globais até refactor maior.
- RLS de `my_vehicles` não muda (filtragem por empresa é a nível de app).
