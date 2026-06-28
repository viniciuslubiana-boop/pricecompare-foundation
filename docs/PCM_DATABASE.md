# PCM — Banco de Dados

Backend: Supabase (Lovable Cloud). RLS habilitado em todas as tabelas.

## Tabelas
| Tabela | Propósito |
|---|---|
| `profiles` | Perfil do usuário (espelha `auth.users`) |
| `user_roles` | Roles `admin` / `gerente` (separada de profiles por segurança) |
| `base_companies` | Empresas Base (máx. 2 ativas) |
| `my_vehicles` | Estoque das Empresas Base |
| `competitors` | Concorrentes monitorados |
| `competitor_vehicles` | Anúncios coletados |
| `comparisons` | Snapshots de comparação |
| `market_update_runs` | Execuções do "Atualizar Mercado" |
| `market_changes` | Detecção de alterações (preço/KM/novo/removido) |
| `import_logs` | Histórico de importações CSV/XLSX |
| `extraction_logs` | Logs do Extraction Engine |
| `ai_logs` | Chamadas ao gateway de IA |
| `api_integrations` | Configurações de APIs externas de estoque |
| `api_integration_logs` | Execuções das integrações |
| `app_settings` | Configurações globais (Loja de Referência etc.) |
| `audit_logs` | Auditoria geral |

## Funções
- `has_role(uuid, app_role)` — SECURITY DEFINER, base de toda policy de role.
- `is_admin(uuid)` — atalho para `has_role(_, 'admin')`.
- `handle_new_user()` — popula `profiles` + role `gerente` no signup.
- `enforce_max_active_base_companies()` — trigger limitando 2 ativas.
- `set_updated_at()` / `update_updated_at_column()` — triggers de timestamp.

## Padrões obrigatórios
1. `CREATE TABLE public.x` → `GRANT` → `ALTER TABLE ENABLE RLS` → `CREATE POLICY`.
2. Toda tabela `public.*` precisa de GRANT para `service_role` + `authenticated`.
3. `anon` só recebe SELECT em tabelas verdadeiramente públicas.
4. Não criar FK para `auth.users` direto — usar `profiles.id`.
