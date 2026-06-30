import type { FipeProvider } from "./fipe.provider";
import type {
  FipeMatchDiagnostics,
  FipeQuoteQuery,
  FipeQuoteResult,
  FipeQuoteWithDiagnostics,
  FipeSegment,
} from "../types/fipe.types";
import {
  containsCompatibleVersionOrDisplacement,
  isAcceptableFipeMatch,
  isFipeModelCompatible,
  normalizeFipeQuery,
  normalizeFuel,
  normalizeText,
  requiresManualFipeVersion,
  scoreFipeCandidate,
  tokenCoverage,
  tokens,
} from "../utils/fipe-normalization";

/**
 * Parallelum FIPE — API pública (https://parallelum.com.br/fipe/api/v1).
 * Sem chave. Executa apenas no servidor (chamado por server functions).
 *
 * Estratégia:
 *  - Tenta "carros" e "motos" (caminhoes opcional) e fica com o primeiro
 *    resultado aceitável (marca exata + ano exato + modelo por tokens).
 *  - Modelo FIPE costuma ser uma descrição longa ("CB 500F Hornet ABS"),
 *    por isso casamos por contenção de tokens do modelo consultado.
 */

const BASE_URL = "https://parallelum.com.br/fipe/api/v1";

type VehicleSegment = FipeSegment;
const SEGMENT_TO_TYPE: Record<VehicleSegment, FipeQuoteResult["vehicle_type"]> = {
  carros: "cars",
  motos: "motorcycles",
  caminhoes: "trucks",
};

type BrandResp = { codigo: string; nome: string };
type ModelResp = { modelos: { codigo: number; nome: string }[]; anos: unknown[] };
type YearResp = { codigo: string; nome: string };
type ValueResp = {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
};

/** Cache em memória por instância — reduz chamadas durante o batch. */
const fipeCache = new Map<string, unknown>();

async function safeJson<T>(url: string): Promise<T | null> {
  const cached = fipeCache.get(url);
  if (cached !== undefined) return cached as T;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    fipeCache.set(url, data);
    return data;
  } catch {
    return null;
  }
}

function parseValor(valor: string): number {
  const cleaned = valor.replace(/[^\d,]/g, "").replace(",", ".");
  return Number(cleaned);
}

function normalizeReferenceMonth(mes: string): string {
  const map: Record<string, string> = {
    janeiro: "01", fevereiro: "02", marco: "03", março: "03", abril: "04",
    maio: "05", junho: "06", julho: "07", agosto: "08", setembro: "09",
    outubro: "10", novembro: "11", dezembro: "12",
  };
  const m = mes.toLowerCase().trim().match(/(\w+)\s+de\s+(\d{4})/);
  if (!m) return mes.trim();
  const mm = map[m[1]] ?? "01";
  return `${m[2]}-${mm}`;
}

/** Heurística leve: brands tipicamente moto. Quando bate, tenta "motos" antes de "carros". */
const MOTO_BRAND_HINTS = new Set([
  "honda", "yamaha", "suzuki", "kawasaki", "harley davidson",
  "ducati", "bmw motorrad", "ktm", "royal enfield", "triumph",
  "shineray", "haojue", "dafra", "traxx", "mottu",
]);

function preferredSegmentOrder(brand: string, model: string): VehicleSegment[] {
  const b = normalizeText(brand);
  const modelToks = tokens(model);
  // Tokens fortes de moto no nome do modelo
  const motoLike = modelToks.some((t) =>
    /^(cb|cg|nxr|xre|xr|biz|pop|crf|cbr|nmax|mt|yzf|fz|crosser|fazer|burgman|gixxer|hornet)/.test(t),
  );
  if (motoLike || MOTO_BRAND_HINTS.has(b)) return ["motos", "carros", "caminhoes"];
  return ["carros", "motos", "caminhoes"];
}

export class ParallelumProvider implements FipeProvider {
  readonly id = "parallelum" as const;

  async quote(query: FipeQuoteQuery): Promise<FipeQuoteResult | null> {
    const { result } = await this.quoteWithDiagnostics(query);
    return result;
  }

  async quoteWithDiagnostics(query: FipeQuoteQuery): Promise<FipeQuoteWithDiagnostics> {
    const startedAt = Date.now();
    const normalizedQuery = normalizeFipeQuery(query);
    const segments = preferredSegmentOrder(normalizedQuery.brand, normalizedQuery.model);
    const diagnostics = this.createDiagnostics(query, normalizedQuery, segments);
    diagnostics.canonical_model = normalizedQuery.model;

    if (!Number.isFinite(query.year_model)) {
      diagnostics.rejection_reason = "ano_nao_encontrado";
      diagnostics.query_duration_ms = Date.now() - startedAt;
      return { result: null, diagnostics };
    }

    if (requiresManualFipeVersion(normalizedQuery.brand, normalizedQuery.model)) {
      diagnostics.final_status = "nao_encontrada";
      diagnostics.rejection_reason = "modelo_nao_encontrado";
      diagnostics.query_duration_ms = Date.now() - startedAt;
      return { result: null, diagnostics };
    }

    for (const segment of segments) {
      const result = await this.quoteInSegment(normalizedQuery, segment, diagnostics);
      if (result) {
        diagnostics.detected_type = result.vehicle_type;
        diagnostics.segment_used = segment;
        diagnostics.fipe_value_returned = result.fipe_value;
        diagnostics.final_status = "encontrada";
        diagnostics.rejection_reason = "aprovado";
        diagnostics.score = scoreFipeCandidate(result.model, query, result);
        diagnostics.query_duration_ms = Date.now() - startedAt;
        return { result, diagnostics };
      }
    }

    if (diagnostics.fipe_brand_found && diagnostics.rejection_reason === "segmento_incorreto") {
      diagnostics.rejection_reason = diagnostics.fipe_candidates_found.length
        ? "ano_nao_encontrado"
        : "modelo_nao_encontrado";
    }
    diagnostics.query_duration_ms = Date.now() - startedAt;
    return { result: null, diagnostics };
  }

  private createDiagnostics(
    original: FipeQuoteQuery,
    normalized: FipeQuoteQuery & {
      brand_alias_applied: string | null;
      model_alias_applied: string | null;
    },
    segments: VehicleSegment[],
  ): FipeMatchDiagnostics {
    return {
      original_brand: original.brand,
      original_model: original.model,
      original_year_model: original.year_model,
      normalized_brand: normalized.brand,
      normalized_model: normalized.model,
      detected_type: null,
      segments_attempted: segments,
      segment_used: null,
      fipe_brand_found: null,
      fipe_candidates_found: [],
      chosen_fipe_model: null,
      fipe_year_evaluated: null,
      fipe_value_returned: null,
      final_status: "nao_encontrada",
      rejection_reason: "segmento_incorreto",
      provider: this.id,
      brand_alias_applied: normalized.brand_alias_applied,
      model_alias_applied: normalized.model_alias_applied,
    };
  }

  private async quoteInSegment(
    query: FipeQuoteQuery,
    segment: VehicleSegment,
    diagnostics: FipeMatchDiagnostics,
  ): Promise<FipeQuoteResult | null> {
    // 1) Marca (exata, normalizada)
    const brands = await safeJson<BrandResp[]>(`${BASE_URL}/${segment}/marcas`);
    if (!brands) {
      diagnostics.rejection_reason = "erro_api";
      return null;
    }
    const wantedBrand = normalizeText(query.brand);
    const brand =
      brands.find((b) => normalizeText(b.nome) === wantedBrand) ??
      brands.find((b) => normalizeText(b.nome).split(" ").includes(wantedBrand));
    if (!brand) {
      if (!diagnostics.fipe_brand_found) diagnostics.rejection_reason = "marca_nao_encontrada";
      return null;
    }
    diagnostics.segment_used = segment;
    diagnostics.detected_type = SEGMENT_TO_TYPE[segment];
    diagnostics.fipe_brand_found = brand.nome;

    // 2) Modelos — todos os tokens da consulta precisam estar no modelo FIPE
    const models = await safeJson<ModelResp>(
      `${BASE_URL}/${segment}/marcas/${brand.codigo}/modelos`,
    );
    if (!models?.modelos?.length) {
      diagnostics.rejection_reason = "erro_api";
      return null;
    }

    const candidateModels = models.modelos
      .map((m) => ({
        ...m,
        coverage: tokenCoverage(m.nome, query.model),
        compatibleVersion: containsCompatibleVersionOrDisplacement(m.nome, query.model),
        score: scoreFipeCandidate(m.nome, query, {
          brand: brand.nome,
          year_model: query.year_model,
          fuel: query.fuel,
        }),
      }))
      .filter((m) => m.coverage === 1 && m.compatibleVersion && isFipeModelCompatible(m.nome, query.model))
      // Maior score, depois maior cobertura, depois modelo mais curto.
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.coverage !== a.coverage) return b.coverage - a.coverage;
        return a.nome.length - b.nome.length;
      });

    diagnostics.fipe_candidates_found = candidateModels.slice(0, 20).map((m) => m.nome);

    if (!candidateModels.length) {
      diagnostics.rejection_reason = "tokens_incompativeis";
      return null;
    }

    // 3) Para cada modelo candidato, busca anos compatíveis
    for (const model of candidateModels) {
      diagnostics.chosen_fipe_model = model.nome;
      const years = await safeJson<YearResp[]>(
        `${BASE_URL}/${segment}/marcas/${brand.codigo}/modelos/${model.codigo}/anos`,
      );
      if (!years?.length) {
        diagnostics.rejection_reason = "erro_api";
        continue;
      }

      const yearCandidates = years.filter((y) =>
        y.codigo.startsWith(`${query.year_model}-`),
      );
      if (!yearCandidates.length) {
        diagnostics.rejection_reason = "ano_nao_encontrado";
        continue;
      }

      for (const y of yearCandidates) {
        diagnostics.fipe_year_evaluated = y.codigo;
        const value = await safeJson<ValueResp>(
          `${BASE_URL}/${segment}/marcas/${brand.codigo}/modelos/${model.codigo}/anos/${y.codigo}`,
        );
        if (!value) {
          diagnostics.rejection_reason = "erro_api";
          continue;
        }

        const result: FipeQuoteResult = {
          fipe_code: value.CodigoFipe,
          brand: value.Marca,
          model: value.Modelo,
          version: null,
          year_model: value.AnoModelo,
          fuel: value.Combustivel,
          fipe_value: parseValor(value.Valor),
          reference_month: normalizeReferenceMonth(value.MesReferencia),
          vehicle_type: SEGMENT_TO_TYPE[segment],
          provider: this.id,
          raw_response: value,
        };

        diagnostics.fipe_value_returned = result.fipe_value;

        if (isAcceptableFipeMatch(result, query)) return result;

        const resultFuel = normalizeFuel(result.fuel);
        const queryFuel = normalizeFuel(query.fuel);
        diagnostics.rejection_reason = resultFuel && queryFuel && resultFuel !== queryFuel
          ? "combustivel_incompativel"
          : "tokens_incompativeis";
      }
    }
    return null;
  }
}
