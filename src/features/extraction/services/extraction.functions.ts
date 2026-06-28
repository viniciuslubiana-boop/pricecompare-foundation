/**
 * Server function: extração real de anúncios de um concorrente.
 * Pipeline: Firecrawl (render JS + markdown) -> Lovable AI (Gemini, JSON estruturado)
 * -> insert em competitor_vehicles + extraction_logs.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  competitorId: z.string().uuid(),
  competitorName: z.string().min(1),
  url: z.string().url(),
});

const Vehicle = z.object({
  brand: z.string(),
  model: z.string(),
  year_model: z.string(),
  km: z.number().nullable(),
  price: z.number().nullable(),
  source_url: z.string().nullable(),
});
const VehicleList = z.object({ vehicles: z.array(Vehicle) });

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function scrapeWithRetry(url: string, apiKey: string) {
  const { default: Firecrawl } = await import("@mendable/firecrawl-js");
  const fc = new Firecrawl({ apiKey });
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fc.scrape(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      });
      const md =
        (res as { markdown?: string }).markdown ??
        (res as { data?: { markdown?: string } }).data?.markdown ??
        "";
      return { markdown: md, attempts: attempt };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // só retry em 429/5xx
      if (!/429|5\d\d|timeout|network/i.test(msg)) break;
      if (attempt < 3) await sleep(5000);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export const runCompetitorExtraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    try {
    const startedAt = new Date();
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY ausente no servidor. Configure o conector Firecrawl.");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY ausente no servidor.");
    

    const errorLog: Array<{ stage: string; message: string; sample?: string }> = [];
    let markdown = "";
    let attempts = 0;

    try {
      const scraped = await scrapeWithRetry(data.url, firecrawlKey);
      markdown = scraped.markdown;
      attempts = scraped.attempts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorLog.push({ stage: "firecrawl", message: msg });
      await context.supabase.from("extraction_logs").insert({
        competitor_id: data.competitorId,
        url: data.url,
        status: "failed",
        started_by: context.userId,
        finished_at: new Date().toISOString(),
        vehicles_found: 0,
        pages_processed: 0,
        total_pages: 1,
        checkpoint_page: 0,
        error_log: errorLog,
      });
      return { savedCount: 0, status: "failed" as const, error: msg };
    }

    if (!markdown || markdown.length < 100) {
      errorLog.push({
        stage: "firecrawl",
        message: "Markdown vazio ou muito curto.",
        sample: markdown.slice(0, 300),
      });
      await context.supabase.from("extraction_logs").insert({
        competitor_id: data.competitorId,
        url: data.url,
        status: "failed",
        started_by: context.userId,
        finished_at: new Date().toISOString(),
        vehicles_found: 0,
        pages_processed: attempts,
        total_pages: 1,
        checkpoint_page: 0,
        error_log: errorLog,
      });
      return { savedCount: 0, status: "failed" as const, error: "Markdown vazio." };
    }

    // === Validação heurística: o markdown realmente contém anúncios? ===
    const signals = {
      priceBRL: (markdown.match(/R\$\s?\d{1,3}(?:[.\s]\d{3})+(?:,\d{2})?/g) ?? []).length,
      km: (markdown.match(/\b\d{1,3}(?:[.\s]?\d{3})*\s?km\b/gi) ?? []).length,
      yearModel: (markdown.match(/\b(?:19|20)\d{2}\s?\/\s?(?:19|20)\d{2}\b/g) ?? []).length,
      brandHits: (markdown.match(
        /\b(fiat|volkswagen|vw|chevrolet|gm|ford|toyota|honda|hyundai|renault|peugeot|citro[eë]n|jeep|nissan|mitsubishi|kia|bmw|mercedes|audi|volvo|land\s?rover|jaguar|porsche|ram|dodge|chery|caoa|byd|gwm)\b/gi,
      ) ?? []).length,
    };
    const score =
      signals.priceBRL * 3 + signals.km * 2 + signals.yearModel * 2 + signals.brandHits;
    // Exige pelo menos 1 preço E (km ou ano ou marca), com score mínimo 6
    const looksLikeListing = signals.priceBRL >= 1 && score >= 6;

    if (!looksLikeListing) {
      errorLog.push({
        stage: "validation",
        message: `Markdown não contém anúncios reconhecíveis (preço=${signals.priceBRL}, km=${signals.km}, ano=${signals.yearModel}, marcas=${signals.brandHits}, score=${score}). Possíveis causas: página de login, captcha, SPA não renderizada, lista vazia ou URL incorreta.`,
        sample: markdown.slice(0, 500),
      });
      await context.supabase.from("extraction_logs").insert({
        competitor_id: data.competitorId,
        url: data.url,
        status: "failed",
        started_by: context.userId,
        finished_at: new Date().toISOString(),
        vehicles_found: 0,
        pages_processed: attempts,
        total_pages: 1,
        checkpoint_page: 0,
        error_log: errorLog,
      });
      return {
        savedCount: 0,
        status: "failed" as const,
        error: "Nenhum anúncio reconhecível no conteúdo retornado pelo scrape.",
      };
    }

    // Trunca para caber confortavelmente no contexto do modelo
    const TRUNC = 60_000;
    const content = markdown.length > TRUNC ? markdown.slice(0, TRUNC) : markdown;

    let vehicles: z.infer<typeof Vehicle>[] = [];
    try {
      const { generateObject } = await import("ai");
      const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
      const gateway = createLovableAiGatewayProvider(lovableKey);
      const model = gateway("google/gemini-3-flash-preview");

      const { object } = await generateObject({
        model,
        schema: VehicleList,
        system:
          "Você extrai anúncios de venda de veículos usados a partir de markdown de páginas de revenda/marketplace. Ignore menus, planos, banners, telefones e CEPs. Retorne SOMENTE veículos à venda com pelo menos marca, modelo e preço.",
        prompt: `Extraia os veículos à venda do conteúdo abaixo do concorrente "${data.competitorName}". Para cada veículo retorne: brand, model (com versão se houver), year_model (formato "AAAA" ou "AAAA/AAAA"), km (número em quilômetros, null se não houver), price (número em reais, null se não houver), source_url (URL do anúncio individual quando aparecer, senão null).\n\n--- CONTEÚDO ---\n${content}`,
      });

      vehicles = object?.vehicles ?? [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorLog.push({ stage: "ai", message: msg, sample: markdown.slice(0, 300) });
      await context.supabase.from("extraction_logs").insert({
        competitor_id: data.competitorId,
        url: data.url,
        status: "failed",
        started_by: context.userId,
        finished_at: new Date().toISOString(),
        vehicles_found: 0,
        pages_processed: attempts,
        total_pages: 1,
        checkpoint_page: 0,
        error_log: errorLog,
      });
      return { savedCount: 0, status: "failed" as const, error: msg };
    }

    // Persistência
    const validVehicles = vehicles.filter(
      (v) =>
        v.brand?.trim() &&
        v.model?.trim() &&
        v.year_model?.trim() &&
        typeof v.price === "number" &&
        v.price > 0,
    );

    let savedCount = 0;
    if (validVehicles.length) {
      const payload = validVehicles.map((v) => ({
        brand: v.brand.trim(),
        model: v.model.trim(),
        year_model: v.year_model.trim(),
        km: v.km ?? 0,
        price: v.price as number,
        source_url: v.source_url ?? data.url,
        competitor_name: data.competitorName,
        confidence: { brand: 90, model: 85, year_model: 85, km: 80, price: 95, average: 87 },
      }));
      const { data: inserted, error } = await context.supabase
        .from("competitor_vehicles")
        .insert(payload)
        .select("id");
      if (error) {
        errorLog.push({ stage: "insert", message: error.message });
      } else {
        savedCount = inserted?.length ?? 0;
      }
    }

    const finishedAt = new Date();
    const status: "completed" | "partial" | "failed" =
      savedCount > 0 && savedCount === vehicles.length
        ? "completed"
        : savedCount > 0
          ? "partial"
          : "failed";

    if (savedCount === 0 && vehicles.length === 0) {
      errorLog.push({
        stage: "ai",
        message: "IA não retornou nenhum veículo a partir do markdown.",
        sample: markdown.slice(0, 300),
      });
    }

    await context.supabase.from("extraction_logs").insert({
      competitor_id: data.competitorId,
      url: data.url,
      status,
      started_by: context.userId,
      finished_at: finishedAt.toISOString(),
      vehicles_found: savedCount,
      pages_processed: attempts,
      total_pages: 1,
      checkpoint_page: 1,
      error_log: errorLog.length ? errorLog : null,
    });

    return { savedCount, status, vehiclesReturned: vehicles.length };
    } catch (fatal) {
      const msg = fatal instanceof Error ? fatal.message : String(fatal);
      console.error("[runCompetitorExtraction] fatal", fatal);
      try {
        await context.supabase.from("extraction_logs").insert({
          competitor_id: data.competitorId,
          url: data.url,
          status: "failed",
          started_by: context.userId,
          finished_at: new Date().toISOString(),
          vehicles_found: 0,
          pages_processed: 0,
          total_pages: 1,
          checkpoint_page: 0,
          error_log: [{ stage: "fatal", message: msg }],
        });
      } catch {
        /* ignore */
      }
      return { savedCount: 0, status: "failed" as const, error: msg };
    }
  });
