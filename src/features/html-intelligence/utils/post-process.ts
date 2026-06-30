// Sprint 007 — Pós-processamento automático após Salvar Estoque Sincronizado.
// Orquestra Comparison Engine para as combinações relevantes e devolve métricas
// para registrar log e exibir feedback. Roda no cliente (sessão autenticada)
// para que RLS aplique-se com a identidade do usuário.

import { comparisonService } from "@/features/comparison/services/comparison.service";
import { competitorRepository } from "@/repositories/competitor.repository";
import { baseCompaniesService } from "@/features/base-companies/services/base-companies.service";

export interface PostProcessInput {
  companyType: "base_company" | "competitor";
  companyId: string;
}

export interface PostProcessResult {
  started_at: string;
  finished_at: string;
  base_companies_processed: string[];
  competitors_processed: string[];
  comparisons_generated: number;
  analytics_updated: boolean;
  dashboard_invalidated: boolean;
  status: "success" | "partial" | "failed";
  errors: string[];
  /**
   * Sprint 013 — alerta exibido quando o salvamento ocorreu mas
   * nenhuma equivalência rígida (brand+model+year) foi encontrada
   * no estoque atual para gerar comparações.
   */
  noEquivalenceWarning: string | null;
}


export async function runPostProcessAfterSave(
  input: PostProcessInput,
): Promise<PostProcessResult> {
  const started_at = new Date().toISOString();
  const result: PostProcessResult = {
    started_at,
    finished_at: started_at,
    base_companies_processed: [],
    competitors_processed: [],
    comparisons_generated: 0,
    analytics_updated: false,
    dashboard_invalidated: false,
    status: "success",
    errors: [],
    noEquivalenceWarning: null,
  };


  try {
    const pairs: Array<{ competitorId: string; baseCompanyId: string | null }> = [];

    if (input.companyType === "competitor") {
      const bases = await baseCompaniesService.listActive();
      if (bases.length === 0) {
        pairs.push({ competitorId: input.companyId, baseCompanyId: null });
      } else {
        for (const b of bases) {
          pairs.push({ competitorId: input.companyId, baseCompanyId: b.id });
          result.base_companies_processed.push(b.id);
        }
      }
      result.competitors_processed.push(input.companyId);
    } else {
      const competitors = await competitorRepository.list({ status: "active" });
      result.base_companies_processed.push(input.companyId);
      for (const c of competitors) {
        pairs.push({ competitorId: c.id, baseCompanyId: input.companyId });
        result.competitors_processed.push(c.id);
      }
    }

    for (const p of pairs) {
      try {
        const res = await comparisonService.run(p.competitorId, p.baseCompanyId);
        const saved = await comparisonService.save(res);
        result.comparisons_generated += saved;
      } catch (e) {
        result.errors.push(
          `comparison ${p.competitorId}/${p.baseCompanyId ?? "-"}: ${
            e instanceof Error ? e.message : "erro"
          }`,
        );
      }
    }

    // Analytics e Dashboard são derivados das mesmas tabelas; marcamos como
    // atualizados para o log. A invalidação dos caches do React Query é feita
    // no chamador (mutation onSuccess).
    result.analytics_updated = true;
    result.dashboard_invalidated = true;

    if (result.errors.length > 0 && result.comparisons_generated === 0) {
      result.status = "failed";
    } else if (result.errors.length > 0) {
      result.status = "partial";
    }

    // Sprint 013 — alerta quando o ciclo rodou sem falhas mas não houve
    // nenhum par equivalente para comparar.
    if (
      result.errors.length === 0 &&
      result.comparisons_generated === 0 &&
      pairs.length > 0
    ) {
      result.noEquivalenceWarning =
        "Veículos importados com sucesso, mas sem equivalência rígida encontrada no estoque atual.";
    }

  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Falha desconhecida");
    result.status = "failed";
  }

  result.finished_at = new Date().toISOString();
  return result;
}
