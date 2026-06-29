# PCM — Segurança

## Princípios

1. RLS habilitada em **toda** tabela `public.*`.
2. Roles em `user_roles` (nunca em `profiles`). Checagem via `public.has_role()` / `public.is_admin()` (`SECURITY DEFINER`, `search_path=public`).
3. Nenhum segredo no bundle client. Toda chamada externa via server function ou Edge Function.
4. Frontend usa apenas `VITE_SUPABASE_URL` + publishable key (anon).
5. `supabaseAdmin` (service role) só para operações privilegiadas em arquivos `*.server.ts`.

## RBAC

- **Administrador (`admin`)** — controle total. Único que gerencia usuários, integrações externas e configurações globais.
- **Gerente (`gerente`)** — operação: estoque, concorrentes, importações, comparações, exclusões em lote.

Tabela `user_roles (user_id, role app_role)` + função:
```sql
public.has_role(_user_id uuid, _role app_role) returns boolean
```

## RLS — Padrão por Tipo de Tabela

| Tipo | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| Dados do usuário (`api_integrations`, `api_integration_logs`) | `auth.uid() = user_id OR is_admin()` | dono ou admin |
| Operacional compartilhado (`my_vehicles`, `competitors`, `comparisons`, ...) | `authenticated` | `gerente` ou `admin` |
| Sensíveis (`app_settings`, `competitors.phone`) | restrito (admin/gerente) | admin |
| Auditoria (`audit_logs`) | admin | **apenas via triggers / service role** |

## Integrações Externas

- **SSRF guard** em `callExternal`: `assertSafeUrl` + `redirect: "manual"` bloqueiam acesso a redes internas e metadata endpoints.
- Headers de autenticação (`api_integrations.auth_header_value`) **nunca** retornados ao client — leitura restrita ao dono/admin.
- Logs (`*_logs`) registram status, duração, HTTP, payload resumido — sem segredos.

## Auth

- Supabase Auth (email/senha + Google OAuth).
- Sessão restaurada em `useAuth`; rotas privadas protegidas pelo layout `_authenticated`.
- `requireSupabaseAuth` middleware exigido em toda server function autenticada.
- Server functions chamadas só a partir de componentes (via `useServerFn`) ou loaders sob `_authenticated/`.

## Segredos (Lovable Cloud)

- `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY`, `GOOGLE_MAPS_API_KEY` e similares ficam no painel de secrets do projeto.
- `SUPABASE_SERVICE_ROLE_KEY` e a senha do banco **não são acessíveis** no Lovable Cloud.

## Auditoria

- `audit_logs` recebe entradas **apenas via triggers** ou service role.
- Operações sensíveis (alteração de roles, integrações externas) devem registrar entrada de auditoria.

## Checklist para nova feature

- [ ] Tabela com `GRANT` + `ENABLE RLS` + policies no mesmo migration.
- [ ] Nenhum segredo no client.
- [ ] Server functions com `requireSupabaseAuth` quando aplicável.
- [ ] URLs externas passam por `assertSafeUrl`.
- [ ] Logs sem dados sensíveis.
