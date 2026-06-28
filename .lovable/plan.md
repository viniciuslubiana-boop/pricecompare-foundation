## Objetivo

Fazer o botão "Atualizar Mercado" extrair anúncios reais de OLX, Webmotors, Mobiauto e sites próprios — substituindo o `fetch()` do browser + regex por um pipeline `Firecrawl (render + markdown) → Lovable AI (Gemini, JSON estruturado)` rodando em server function.

## Mudanças

### 1. Conectar Firecrawl
- Connector `firecrawl` (renderiza JS, contorna CORS/anti-bot, retorna markdown limpo).
- Secret `FIRECRAWL_API_KEY` fica disponível no servidor.

### 2. Server function `runCompetitorExtraction` (nova)
Arquivo: `src/features/extraction/services/extraction.functions.ts`
- `createServerFn` + `requireSupabaseAuth`.
- Input: `{ competitorId, url }`.
- Passos:
  1. `firecrawl.scrape(url, { formats: ['markdown'], onlyMainContent: true, waitFor: 3000 })` com retry 3x / 5s.
  2. Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com `Output.array` e schema Zod: `brand, model, version, year_model, km, price, source_url, photo_url, city`.
  3. Insere em `competitor_vehicles` (campos novos serão adicionados via migration na sprint seguinte — por ora persiste só os já existentes e descarta extras com warning).
  4. Cria registro em `extraction_logs` com `pages_processed`, `vehicles_found`, `error_log`.

### 3. Atualizar `market-update.service.ts`
- Substituir o `fetch(competitor.url)` + `extractionService.preview/confirm` por **chamada à nova server function**.
- Mantém orquestração, progresso, detecção de changes e Comparison Engine intactos.

### 4. Tela de Diagnóstico (mínima — só leitura)
Rota: `/diagnostico-extracao`
- Lê `extraction_logs` (últimos 50), refetch 5s.
- Colunas: concorrente, URL, status, páginas, veículos, último erro, duração.
- Item no menu lateral.

## Fora do escopo (próxima sprint)

- Paginação multi-página (Firecrawl `crawl` por domínio).
- Novos campos `version/photo_url/city/source` no schema `competitor_vehicles`.
- Checkpoint real / retomada.
- Painel em tempo real durante o run (atual usa polling simples).

## Detalhes técnicos

- Modelo: `google/gemini-3-flash-preview` (default Lovable AI).
- Schema do `Output.array` enxuto (sem enums longos, sem `format`/`pattern`) para evitar erro "too many states" do Gemini.
- Prompt em PT-BR pedindo apenas veículos à venda no markdown fornecido, descartando menus/anúncios de plano.
- Retries só em 429 e 5xx do Firecrawl/Gateway; 4xx fail-fast.
- Sem chamada de IA do browser; `LOVABLE_API_KEY` lido via `process.env` dentro do `.handler()`.
- Bearer attacher já registrado em `src/start.ts`.

## Risco conhecido

Webmotors/Mobiauto têm proteção anti-bot agressiva. Firecrawl resolve a maioria, mas algumas URLs específicas (resultados de busca paginada) podem voltar vazias — o log mostrará "0 veículos" com markdown salvo no `error_log` para diagnóstico.
