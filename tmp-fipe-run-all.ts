import { createClient } from '@supabase/supabase-js';
import { ParallelumProvider } from '/dev-server/src/features/fipe/providers/parallelum.provider.ts';
import type { FipeMatchDiagnostics, FipeQuoteResult, FipeVehicleUpdateOutcome } from '/dev-server/src/features/fipe/types/fipe.types.ts';
import { currentReferenceMonth, isAcceptableFipeMatch, parseYearModel } from '/dev-server/src/features/fipe/utils/fipe-normalization.ts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase env not available');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const provider = new ParallelumProvider();

function summarizeOutcomeReasons(outcomes: FipeVehicleUpdateOutcome[]) {
  return outcomes.reduce<Record<string, number>>((acc, outcome) => {
    const reason = outcome.diagnostics?.rejection_reason ?? outcome.reason ?? 'sem_motivo';
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});
}

function invalidYearDiagnostics(v: any): FipeMatchDiagnostics {
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
    final_status: 'nao_encontrada',
    rejection_reason: 'ano_nao_encontrado',
    provider: 'parallelum',
  };
}

async function persistFipeReference(result: FipeQuoteResult) {
  if (!result.fipe_code) return;
  const { error } = await supabase.from('fipe_references').upsert(
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
    { onConflict: 'fipe_code,year_model,reference_month' },
  );
  if (error) throw error;
}

async function runBase(baseCompanyId: string) {
  const { data: vehicles, error } = await supabase
    .from('my_vehicles')
    .select('id, brand, model, year_model, fipe_code')
    .eq('base_company_id', baseCompanyId)
    .order('brand')
    .order('model');
  if (error) throw error;

  const list = (vehicles ?? []).map((v: any) => ({
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
        await supabase.from('my_vehicles').update({ fipe_status: 'nao_encontrada' }).eq('id', v.id);
        outcomes.push({ vehicle_id: v.id, status: 'nao_encontrada', reason: 'ano/modelo invalido', diagnostics: invalidYearDiagnostics(v) });
        continue;
      }

      const quoted = await provider.quoteWithDiagnostics({ brand: v.brand, model: v.model, year_model: v.year_model, fipe_code: v.fipe_code });
      const result = quoted.result;
      if (!result) {
        unmatched++;
        await supabase.from('my_vehicles').update({ fipe_status: 'nao_encontrada' }).eq('id', v.id);
        outcomes.push({ vehicle_id: v.id, status: 'nao_encontrada', reason: quoted.diagnostics.rejection_reason, diagnostics: quoted.diagnostics });
        continue;
      }

      if (!isAcceptableFipeMatch(result, v)) {
        unmatched++;
        const diagnostics = { ...quoted.diagnostics, final_status: 'nao_encontrada' as const, rejection_reason: 'tokens_incompativeis' as const };
        await supabase.from('my_vehicles').update({ fipe_status: 'nao_encontrada' }).eq('id', v.id);
        outcomes.push({ vehicle_id: v.id, status: 'nao_encontrada', reason: 'match nao aceitavel', diagnostics });
        continue;
      }

      await persistFipeReference(result);
      const { error: updateError } = await supabase
        .from('my_vehicles')
        .update({
          fipe_code: result.fipe_code,
          fipe_value: result.fipe_value,
          fipe_reference_month: result.reference_month,
          fipe_status: 'encontrada',
          fipe_link_mode: 'auto',
          fipe_linked_at: new Date().toISOString(),
        })
        .eq('id', v.id);
      if (updateError) throw updateError;
      matched++;
      outcomes.push({ vehicle_id: v.id, status: 'encontrada', fipe_value: result.fipe_value, fipe_code: result.fipe_code, reference_month: result.reference_month, diagnostics: quoted.diagnostics });
    } catch (e) {
      errors++;
      const diagnostics: FipeMatchDiagnostics = {
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
        final_status: 'nao_encontrada',
        rejection_reason: 'erro_api',
        provider: 'parallelum',
      };
      outcomes.push({ vehicle_id: v.id, status: 'nao_encontrada', reason: e instanceof Error ? e.message : 'erro', diagnostics });
    }
  }

  const { data: log, error: logError } = await supabase.from('fipe_update_logs').insert({
    base_company_id: baseCompanyId,
    triggered_by: null,
    provider: 'parallelum',
    total_vehicles: list.length,
    matched,
    unmatched,
    errors,
    status: errors > 0 ? 'partial' : 'success',
    message: `${matched} encontrados / ${unmatched} não encontrados / ${errors} erros`,
    details: {
      reference_month: currentReferenceMonth(),
      outcomes,
      rejection_summary: summarizeOutcomeReasons(outcomes),
    },
  }).select('id').single();
  if (logError) throw logError;
  return { log_id: log.id, total_vehicles: list.length, matched, unmatched, errors, rejection_summary: summarizeOutcomeReasons(outcomes), outcomes };
}

const { data: companies, error: companyError } = await supabase.from('base_companies').select('id, name').eq('status', 'active').order('name');
if (companyError) throw companyError;
const report: any[] = [];
for (const company of companies ?? []) {
  const res = await runBase(company.id);
  report.push({
    company,
    log_id: res.log_id,
    total_vehicles: res.total_vehicles,
    matched: res.matched,
    unmatched: res.unmatched,
    manual_required: res.outcomes.filter((o) => o.diagnostics?.rejection_reason === 'modelo_nao_encontrado').length,
    errors: res.errors,
    rejection_summary: res.rejection_summary,
    success_examples: res.outcomes.filter((o) => o.status === 'encontrada').slice(0, 5).map((o) => ({ vehicle_id: o.vehicle_id, original: `${o.diagnostics?.original_brand} ${o.diagnostics?.original_model} ${o.diagnostics?.original_year_model}`, fipe: o.diagnostics?.chosen_fipe_model, value: o.fipe_value })),
    failure_examples: res.outcomes.filter((o) => o.status !== 'encontrada').slice(0, 5).map((o) => ({ vehicle_id: o.vehicle_id, original: `${o.diagnostics?.original_brand} ${o.diagnostics?.original_model} ${o.diagnostics?.original_year_model}`, reason: o.diagnostics?.rejection_reason, candidates: o.diagnostics?.fipe_candidates_found?.slice(0, 3) })),
  });
}
const { count } = await supabase.from('fipe_references').select('id', { count: 'exact', head: true });
console.log(JSON.stringify({ report, fipe_references_count: count }, null, 2));
