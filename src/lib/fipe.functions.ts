import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { ParallelumProvider } from "@/features/fipe/providers/parallelum.provider";
import { CommercialProvider } from "@/features/fipe/providers/commercial.provider";
import type { FipeProvider } from "@/features/fipe/providers/fipe.provider";
import type {
  FipeProviderId,
  FipeMatchDiagnostics,
  FipeQuoteResult,
  FipeUpdateRunResult,
  FipeVehicleUpdateOutcome,
} from "@/features/fipe/types/fipe.types";
import {
  currentReferenceMonth,
  isAcceptableFipeMatch,
  parseYearModel,
} from "@/features/fipe/utils/fipe-normalization";


function getProvider(id: FipeProviderId): FipeProvider {
  switch (id) {
    case "commercial":
      return new CommercialProvider();
    case "parallelum":
    default:
      return new ParallelumProvider();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getActiveProviderId(supabase: any): Promise<FipeProviderId> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "fipe_provider")
      .maybeSingle();
    const active = (data?.value as { active?: string } | undefined)?.active;
    if (active === "commercial" || active === "parallelum") return active;
  } catch {
    /* fallback abaixo */
  }
  return "parallelum";
}

async function persistFipeReference(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  result: FipeQuoteResult,
) {
  if (!result.fipe_code) return;
  await supabase
    .from("fipe_references")
    .upsert(
      {
        vehicle_type: result.vehicle_type,
        brand: result.brand,
        model: result.model,
        version: result.version,
        year_model: result.year_model,
        fuel: result.fuel,
        fipe_code: result.fipe_code,
        fipe_value: result.fipe_value,
        reference_month: result.reference_month,
        provider: result.provider,
        raw_response: result.raw_response ?? null,
      },
      { onConflict: "fipe_code,year_model,reference_month" },
    );
}

function summarizeOutcomeReasons(outcomes: FipeVehicleUpdateOutcome[]) {
  return outcomes.reduce<Record<string, number>>((acc, outcome) => {
    const reason = outcome.diagnostics?.rejection_reason ?? outcome.reason ?? "sem_motivo";
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});
}

function invalidYearDiagnostics(v: {
  id: string;
  brand: string;
  model: string;
  original_year_model: number | string | null;
}, provider: FipeProviderId): FipeMatchDiagnostics {
  return {
    original_brand: v.brand,
    original_model: v.model,
    original_year_model: v.original_year_model,
    normalized_brand: v.brand,
    normalized_model: v.model,
    detected_type: null,
    segments_attempted: [],
    segment_used: null,
    fipe_brand_found: null,
    fipe_candidates_found: [],
    chosen_fipe_model: null,
    fipe_year_evaluated: null,
    fipe_value_returned: null,
    final_status: "nao_encontrada",
    rejection_reason: "ano_nao_encontrado",
    provider,
  };
}

/** Cotação avulsa (usada no diálogo de vinculação manual). */
export const fipeQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        brand: z.string().min(1),
        model: z.string().min(1),
        year_model: z.number().int(),
        fuel: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (context as any).supabase;
    const providerId = await getActiveProviderId(supabase);
    const provider = getProvider(providerId);
    const result = await provider.quote(data);
    if (result) await persistFipeReference(supabase, result);
    if (!result) return null;
    const { raw_response: _r, ...safe } = result;
    void _r;
    return safe;
  });

/** Atualização em lote da Empresa Base. */
export const fipeUpdateRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ base_company_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<FipeUpdateRunResult> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (context as any).supabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (context as any).userId as string;

    const providerId = await getActiveProviderId(supabase);
    const provider = getProvider(providerId);
    const refMonth = currentReferenceMonth();

    const { data: vehicles, error } = await supabase
      .from("my_vehicles")
      .select("id, brand, model, year_model, fipe_code")
      .eq("base_company_id", data.base_company_id);

    if (error) throw new Error(error.message);
    const list = ((vehicles ?? []) as Array<{
      id: string;
      brand: string;
      model: string;
      year_model: number | string;
      fipe_code: string | null;
    }>).map((v) => ({
      ...v,
      original_year_model: v.year_model,
      year_model: parseYearModel(v.year_model),
    }));


    const outcomes: FipeVehicleUpdateOutcome[] = [];
    let matched = 0;
    let unmatched = 0;
    let errors = 0;

    for (const v of list) {
      try {
        if (!Number.isFinite(v.year_model)) {
          unmatched++;
          await supabase
            .from("my_vehicles")
            .update({ fipe_status: "nao_encontrada" })
            .eq("id", v.id);
          outcomes.push({
            vehicle_id: v.id,
            status: "nao_encontrada",
            reason: "ano/modelo invalido",
            diagnostics: invalidYearDiagnostics(v, providerId),
          });
          continue;
        }

        const quoteInput = {
          brand: v.brand,
          model: v.model,
          year_model: v.year_model,
          fipe_code: v.fipe_code,
        };
        const quoted = provider.quoteWithDiagnostics
          ? await provider.quoteWithDiagnostics(quoteInput)
          : { result: await provider.quote(quoteInput), diagnostics: undefined };
        const result = quoted.result;

        if (!result) {
          unmatched++;
          await supabase
            .from("my_vehicles")
            .update({ fipe_status: "nao_encontrada" })
            .eq("id", v.id);
          outcomes.push({
            vehicle_id: v.id,
            status: "nao_encontrada",
            reason: quoted.diagnostics?.rejection_reason,
            diagnostics: quoted.diagnostics,
          });
          continue;
        }

        // Validação final: marca exata + ano exato + modelo compatível por tokens
        if (!isAcceptableFipeMatch(result, v)) {
          unmatched++;
          await supabase
            .from("my_vehicles")
            .update({ fipe_status: "nao_encontrada" })
            .eq("id", v.id);
          outcomes.push({
            vehicle_id: v.id,
            status: "nao_encontrada",
            reason: "match nao aceitavel",
            diagnostics: quoted.diagnostics
              ? {
                  ...quoted.diagnostics,
                  final_status: "nao_encontrada",
                  rejection_reason: "tokens_incompativeis",
                }
              : undefined,
          });
          continue;
        }


        await persistFipeReference(supabase, result);
        await supabase
          .from("my_vehicles")
          .update({
            fipe_code: result.fipe_code,
            fipe_value: result.fipe_value,
            fipe_reference_month: result.reference_month,
            fipe_status: "encontrada",
            fipe_link_mode: "auto",
            fipe_linked_at: new Date().toISOString(),
          })
          .eq("id", v.id);

        matched++;
        outcomes.push({
          vehicle_id: v.id,
          status: "encontrada",
          fipe_value: result.fipe_value,
          fipe_code: result.fipe_code,
          reference_month: result.reference_month,
          diagnostics: quoted.diagnostics,
        });
      } catch (e) {
        errors++;
        outcomes.push({
          vehicle_id: v.id,
          status: "nao_encontrada",
          reason: e instanceof Error ? e.message : "erro",
          diagnostics: {
            original_brand: v.brand,
            original_model: v.model,
            original_year_model: v.original_year_model,
            normalized_brand: v.brand,
            normalized_model: v.model,
            detected_type: null,
            segments_attempted: [],
            segment_used: null,
            fipe_brand_found: null,
            fipe_candidates_found: [],
            chosen_fipe_model: null,
            fipe_year_evaluated: null,
            fipe_value_returned: null,
            final_status: "nao_encontrada",
            rejection_reason: "erro_api",
            provider: providerId,
          },
        });
      }
    }

    const { data: log } = await supabase
      .from("fipe_update_logs")
      .insert({
        base_company_id: data.base_company_id,
        triggered_by: userId,
        provider: providerId,
        total_vehicles: list.length,
        matched,
        unmatched,
        errors,
        status: errors > 0 ? "partial" : "success",
        message: `${matched} encontrados / ${unmatched} não encontrados / ${errors} erros`,
        details: {
          reference_month: refMonth,
          outcomes,
          rejection_summary: summarizeOutcomeReasons(outcomes),
        },
      })
      .select("id")
      .single();

    return {
      log_id: (log?.id as string) ?? "",
      total_vehicles: list.length,
      matched,
      unmatched,
      errors,
      outcomes,
    };
  });

/** Vinculação manual: usuário informa o código FIPE. */
export const fipeManualLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        vehicle_id: z.string().uuid(),
        brand: z.string().min(1),
        model: z.string().min(1),
        year_model: z.number().int(),
        fuel: z.string().nullable().optional(),
        fipe_code: z.string().min(3),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (context as any).supabase;
    const providerId = await getActiveProviderId(supabase);
    const provider = getProvider(providerId);

    const result = await provider.quote({
      brand: data.brand,
      model: data.model,
      year_model: data.year_model,
      fuel: data.fuel,
      fipe_code: data.fipe_code,
    });

    if (!result) {
      throw new Error("Não foi possível confirmar o código FIPE informado.");
    }

    await persistFipeReference(supabase, result);
    await supabase
      .from("my_vehicles")
      .update({
        fipe_code: result.fipe_code ?? data.fipe_code,
        fipe_value: result.fipe_value,
        fipe_reference_month: result.reference_month,
        fipe_status: "vinculada_manualmente",
        fipe_link_mode: "manual",
        fipe_linked_at: new Date().toISOString(),
      })
      .eq("id", data.vehicle_id);

    const { raw_response: _r, ...safe } = result;
    void _r;
    return safe;
  });
