import type { FipeProvider } from "./fipe.provider";
import type { FipeQuoteQuery, FipeQuoteResult } from "../types/fipe.types";
import {
  isAcceptableFipeMatch,
  isFipeModelCompatible,
  normalizeText,
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

type VehicleSegment = "carros" | "motos" | "caminhoes";
const SEGMENTS: VehicleSegment[] = ["carros", "motos", "caminhoes"];
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

async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
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
    if (!Number.isFinite(query.year_model)) return null;

    const segments = preferredSegmentOrder(query.brand, query.model);
    for (const segment of segments) {
      const result = await this.quoteInSegment(query, segment);
      if (result) return result;
    }
    return null;
  }

  private async quoteInSegment(
    query: FipeQuoteQuery,
    segment: VehicleSegment,
  ): Promise<FipeQuoteResult | null> {
    // 1) Marca (exata, normalizada)
    const brands = await safeJson<BrandResp[]>(`${BASE_URL}/${segment}/marcas`);
    if (!brands) return null;
    const wantedBrand = normalizeText(query.brand);
    const brand =
      brands.find((b) => normalizeText(b.nome) === wantedBrand) ??
      brands.find((b) => normalizeText(b.nome).split(" ").includes(wantedBrand));
    if (!brand) return null;

    // 2) Modelos — todos os tokens da consulta precisam estar no modelo FIPE
    const models = await safeJson<ModelResp>(
      `${BASE_URL}/${segment}/marcas/${brand.codigo}/modelos`,
    );
    if (!models?.modelos?.length) return null;

    const candidateModels = models.modelos
      .filter((m) => isFipeModelCompatible(m.nome, query.model))
      // Prefere modelo mais "curto" (menos versões/sufixos), depois ordem natural
      .sort((a, b) => a.nome.length - b.nome.length);

    if (!candidateModels.length) return null;

    // 3) Para cada modelo candidato, busca anos compatíveis
    for (const model of candidateModels) {
      const years = await safeJson<YearResp[]>(
        `${BASE_URL}/${segment}/marcas/${brand.codigo}/modelos/${model.codigo}/anos`,
      );
      if (!years?.length) continue;

      const yearCandidates = years.filter((y) =>
        y.codigo.startsWith(`${query.year_model}-`),
      );
      if (!yearCandidates.length) continue;

      for (const y of yearCandidates) {
        const value = await safeJson<ValueResp>(
          `${BASE_URL}/${segment}/marcas/${brand.codigo}/modelos/${model.codigo}/anos/${y.codigo}`,
        );
        if (!value) continue;

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

        if (isAcceptableFipeMatch(result, query)) return result;
      }
    }
    return null;
  }
}
