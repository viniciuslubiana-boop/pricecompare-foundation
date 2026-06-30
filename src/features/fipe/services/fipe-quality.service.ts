import { supabase } from "@/integrations/supabase/client";

export interface FipeQualitySnapshot {
  coverage_pct: number;
  total: number;
  matched: number;
  unmatched: number;
  manual: number;
  not_verified: number;
  avg_query_duration_ms: number;
  avg_score: number;
  top_rejection_reasons: Array<{ reason: string; count: number }>;
  top_brand_failures: Array<{ key: string; count: number }>;
  top_model_failures: Array<{ key: string; count: number }>;
  last_run_at: string | null;
}

interface AuditSummary {
  avg_score?: number;
  avg_query_duration_ms?: number;
  top_brand_failures?: Array<{ key: string; count: number }>;
  top_model_failures?: Array<{ key: string; count: number }>;
}

interface RunDetails {
  rejection_summary?: Record<string, number>;
  audit_summary?: AuditSummary;
}

export const fipeQualityService = {
  async load(baseCompanyId?: string | null): Promise<FipeQualitySnapshot> {
    // Vehicle status counts
    let vq = supabase.from("my_vehicles").select("fipe_status", { count: "exact" });
    if (baseCompanyId) vq = vq.eq("base_company_id", baseCompanyId);
    const { data: vehicles } = await vq;

    const total = vehicles?.length ?? 0;
    let matched = 0;
    let unmatched = 0;
    let manual = 0;
    let notVerified = 0;
    for (const v of vehicles ?? []) {
      const s = (v as { fipe_status: string }).fipe_status;
      if (s === "encontrada") matched++;
      else if (s === "vinculada_manualmente") manual++;
      else if (s === "nao_encontrada") unmatched++;
      else notVerified++;
    }

    // Last run for audit summary
    let lq = supabase
      .from("fipe_update_logs")
      .select("created_at, details")
      .order("created_at", { ascending: false })
      .limit(1);
    if (baseCompanyId) lq = lq.eq("base_company_id", baseCompanyId);
    const { data: logs } = await lq;
    const last = logs?.[0] as { created_at: string; details: RunDetails } | undefined;
    const details = last?.details ?? {};
    const rejSummary = details.rejection_summary ?? {};
    const audit = details.audit_summary ?? {};

    return {
      coverage_pct: total ? Math.round(((matched + manual) / total) * 1000) / 10 : 0,
      total,
      matched,
      unmatched,
      manual,
      not_verified: notVerified,
      avg_query_duration_ms: audit.avg_query_duration_ms ?? 0,
      avg_score: audit.avg_score ?? 0,
      top_rejection_reasons: Object.entries(rejSummary)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      top_brand_failures: audit.top_brand_failures ?? [],
      top_model_failures: audit.top_model_failures ?? [],
      last_run_at: last?.created_at ?? null,
    };
  },
};
