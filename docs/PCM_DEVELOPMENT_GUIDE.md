# PCM — Guia de Desenvolvimento

## Antes de criar algo novo
1. **Procurar** se já existe (component, hook, service, schema, type).
2. **Reutilizar** o que existe — nunca duplicar.
3. **Estender** o Engine apropriado ao invés de criar paralelo.

## Estrutura de pastas
```
src/
  features/<engine>/
    components/    # UI específica do engine
    hooks/         # useXxx — React Query
    services/      # *.service.ts (client) / *.functions.ts (server fn)
    schemas/       # Zod
    types/         # TS types
    utils/         # puro, sem React
  components/      # UI compartilhada (shadcn em ui/)
  routes/          # File-based routing TanStack
    _authenticated/ # tudo que exige login
```

## Regras de código
- **TypeScript estrito** — sem `any` solto, sem imports quebrados.
- **Server fns** em `*.functions.ts` (client-safe path). Nunca em `src/server/`.
- **Server-only** em `*.server.ts`. Carregar `client.server` somente dentro do `.handler()`.
- **Arquivos `.client.*` NÃO** podem ser importados por código alcançável pelo bundle server.
- **Cálculos de negócio** ficam nos Engines, não em componentes.
- **Estado servidor** sempre via TanStack Query (não useEffect + fetch).
- **Toasts** via `sonner`. **Confirmações** via `ConfirmDialog`.

## Padrão visual
- Apenas tokens semânticos (`bg-background`, `text-foreground`, etc.) — **nunca** cores hardcoded.
- Componentes shadcn em `src/components/ui/`.
- Todo texto em **português**.
- Responsivo desktop / tablet / celular.

## Auditoria antes de finalizar
TypeScript · ESLint · imports · duplicação · RLS · responsividade · performance.
