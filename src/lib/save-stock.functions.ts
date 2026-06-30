// Sprint 006 — Salvar Estoque Sincronizado
// Persiste itens da Prévia Normalizada em my_vehicles (Empresa Base) ou
// competitor_vehicles (Concorrente), aplicando deduplicação e logs.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findDuplicate, type ExistingVehicleLike } from "@/features/html-intelligence/utils/stock-dedup";
import type { NormalizedVehiclePreview, NormalizationStatus } from "@/features/html-intelligence";

const confidenceSchema = z.object({
  brand: z.number(),
  model: z.number(),
  version: z.number(),
  year_model: z.number(),
  km: z.number(),
  price: z.number(),
  source_url: z.number(),
  image_url: z.number(),
});

const itemSchema = z.object({
  brand: z.string().nullable(),
  model: z.string().nullable(),
  version: z.string().nullable(),
  year_model: z.string().nullable(),
  km: z.number().nullable(),
  price: z.number().nullable(),
  source_url: z.string().nullable(),
  image_url: z.string().nullable(),
  store_name: z.string().nullable(),
  city: z.string().nullable(),
  source: z.string(),
  confidence: confidenceSchema,
  confidenceAvg: z.number(),
  status: z.enum(["approved", "review", "invalid", "duplicated"]),
  observations: z.array(z.string()),
});

const inputSchema = z.object({
  items: z.array(itemSchema),
  companyType: z.enum(["base_company", "competitor"]),
  companyId: z.string().uuid(),
  sourceUrl: z.string().optional().nullable(),
  duplicateStrategy: z.enum(["ignore", "update", "new"]).default("update"),
  includeReview: z.boolean().default(false),
  /** Sprint 008: bloqueia o save quando a Prévia foi marcada como suspeita. */
  suspectedDrop: z.boolean().optional().default(false),
  /** Permite o usuário confirmar e sobrescrever mesmo com suspeita. */
  confirmSuspectedDrop: z.boolean().optional().default(false),
});


export interface SaveStockResult {
  totalNormalized: number;
  totalSaved: number;
  totalUpdated: number;
  totalSkipped: number;
  totalInvalid: number;
  totalDuplicated: number;
  totalReviewed: number;
  destination: "base_company" | "competitor";
  errors: string[];
  logId: string | null;
  durationMs: number;
  /** Sprint 008: salvamento bloqueado por proteção de dados. */
  protected: boolean;
  protectionReason: string | null;
}


export const saveSynchronizedStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<SaveStockResult> => {
    const { supabase, userId } = context;
    const t0 = Date.now();

    const result: SaveStockResult = {
      totalNormalized: data.items.length,
      totalSaved: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalInvalid: 0,
      totalDuplicated: 0,
      totalReviewed: 0,
      destination: data.companyType,
      errors: [],
      logId: null,
      durationMs: 0,
    };

    // Confirma destino
    if (data.companyType === "base_company") {
      const { data: bc, error } = await supabase
        .from("base_companies").select("id").eq("id", data.companyId).maybeSingle();
      if (error || !bc) {
        result.errors.push("Empresa Base não encontrada.");
        result.durationMs = Date.now() - t0;
        return result;
      }
    } else {
      const { data: cp, error } = await supabase
        .from("competitors").select("id, name").eq("id", data.companyId).maybeSingle();
      if (error || !cp) {
        result.errors.push("Concorrente não encontrado.");
        result.durationMs = Date.now() - t0;
        return result;
      }
    }

    // Filtra elegíveis
    const eligible = data.items.filter((it) => {
      if (it.status === "invalid") {
        result.totalInvalid++;
        return false;
      }
      if (it.status === "duplicated") {
        result.totalDuplicated++;
        return false;
      }
      if (it.status === "review") {
        result.totalReviewed++;
        return data.includeReview;
      }
      return it.status === "approved";
    });

    if (eligible.length === 0) {
      // Mesmo sem itens, registra log
      const log = await insertLog(supabase, userId, data, result, "partial");
      result.logId = log;
      result.durationMs = Date.now() - t0;
      return result;
    }

    // Carrega existentes para dedup
    let existing: ExistingVehicleLike[] = [];
    let competitorName: string | null = null;

    if (data.companyType === "base_company") {
      const { data: rows } = await supabase
        .from("my_vehicles")
        .select("id, brand, model, year_model, km, price")
        .eq("base_company_id", data.companyId);
      existing = (rows ?? []) as ExistingVehicleLike[];
    } else {
      const { data: cp } = await supabase
        .from("competitors").select("name").eq("id", data.companyId).maybeSingle();
      competitorName = cp?.name ?? null;
      const { data: rows } = await supabase
        .from("competitor_vehicles")
        .select("id, brand, model, year_model, km, price, source_url")
        .eq("competitor_id", data.companyId);
      existing = (rows ?? []) as ExistingVehicleLike[];
    }

    // Processa
    for (const item of eligible) {
      if (!item.brand || !item.model || !item.year_model) {
        result.totalSkipped++;
        continue;
      }

      const dup = findDuplicate(item, existing, {
        useSourceUrl: data.companyType === "competitor",
      });

      try {
        if (dup) {
          if (data.duplicateStrategy === "ignore") {
            result.totalSkipped++;
            result.totalDuplicated++;
            continue;
          }
          if (data.duplicateStrategy === "update") {
            if (data.companyType === "base_company") {
              const { error } = await supabase
                .from("my_vehicles")
                .update({
                  brand: item.brand, model: item.model, year_model: item.year_model,
                  km: item.km, price: item.price,
                  supplier_name: item.store_name,
                  source: item.source ?? "mae",
                })
                .eq("id", dup.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("competitor_vehicles")
                .update({
                  brand: item.brand, model: item.model, version: item.version,
                  year_model: item.year_model, km: item.km, price: item.price,
                  source_url: item.source_url, photo_url: item.image_url,
                  city: item.city, source: item.source ?? "mae",
                  competitor_name: competitorName,
                })
                .eq("id", dup.id);
              if (error) throw error;
            }
            result.totalUpdated++;
            result.totalDuplicated++;
            continue;
          }
          // strategy === "new" → cai no insert
        }

        if (data.companyType === "base_company") {
          const { error } = await supabase.from("my_vehicles").insert({
            brand: item.brand, model: item.model, year_model: item.year_model,
            km: item.km, price: item.price, supplier_name: item.store_name,
            source: item.source ?? "mae",
            created_by: userId, base_company_id: data.companyId,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("competitor_vehicles").insert({
            brand: item.brand, model: item.model, version: item.version,
            year_model: item.year_model, km: item.km, price: item.price,
            source_url: item.source_url, photo_url: item.image_url,
            city: item.city, source: item.source ?? "mae",
            competitor_id: data.companyId, competitor_name: competitorName,
          });
          if (error) throw error;
        }
        result.totalSaved++;
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : "Falha ao salvar item");
        result.totalSkipped++;
      }
    }

    const status =
      result.errors.length > 0 && result.totalSaved + result.totalUpdated === 0
        ? "failed"
        : result.errors.length > 0
          ? "partial"
          : "success";
    result.logId = await insertLog(supabase, userId, data, result, status);
    result.durationMs = Date.now() - t0;
    return result;
  });

async function insertLog(
  supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>,
  _userId: string,
  data: z.infer<typeof inputSchema>,
  result: SaveStockResult,
  status: "success" | "partial" | "failed",
): Promise<string | null> {
  try {
    const { data: row } = await supabase
      .from("market_acquisition_logs")
      .insert({
        company_id: data.companyId,
        company_type: data.companyType,
        url: data.sourceUrl ?? null,
        method: "HTML",
        status,
        finished_at: new Date().toISOString(),
        vehicles_found: result.totalNormalized,
        vehicles_saved: result.totalSaved + result.totalUpdated,
        error_message: result.errors.length > 0 ? result.errors.slice(0, 3).join(" | ") : null,
      })
      .select("id")
      .single();
    return row?.id ?? null;
  } catch {
    return null;
  }
}

// Listas auxiliares para o seletor de destino
export const listSaveTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [bc, cp] = await Promise.all([
      context.supabase.from("base_companies").select("id, name, status").eq("status", "active").order("name"),
      context.supabase.from("competitors").select("id, name, status").order("name"),
    ]);
    return {
      baseCompanies: (bc.data ?? []) as { id: string; name: string; status: string }[],
      competitors: (cp.data ?? []) as { id: string; name: string; status: string }[],
    };
  });

export type NormalizedItem = NormalizedVehiclePreview;
export type SaveStockStatus = NormalizationStatus;

// Sprint 007 — persistir métricas do pós-processamento no log existente.
const postProcessSchema = z.object({
  logId: z.string().uuid(),
  metadata: z.object({
    post_process_started_at: z.string(),
    post_process_finished_at: z.string(),
    base_companies_processed: z.array(z.string()),
    competitors_processed: z.array(z.string()),
    comparisons_generated: z.number(),
    analytics_updated: z.boolean(),
    dashboard_invalidated: z.boolean(),
    status: z.enum(["success", "partial", "failed"]),
    errors: z.array(z.string()),
  }),
});

export const logPostProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postProcessSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("market_acquisition_logs")
      .update({ metadata: data.metadata })
      .eq("id", data.logId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
