import type { FipeProvider } from "./fipe.provider";
import type { FipeQuoteQuery, FipeQuoteResult } from "../types/fipe.types";
import { isStrictFipeMatch, normalizeText } from "../utils/fipe-normalization";

/**
 * Parallelum FIPE — API pública (https://deninfra.parallelum.com.br/fipe/api/v1).
 * Sem chave. Executa apenas no servidor (chamado por server functions).
 */

const BASE_URL = "https://parallelum.com.br/fipe/api/v1";
const VEHICLE_TYPE = "carros"; // V1 da API exige "carros|motos|caminhoes"

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
  // "R$ 45.300,00" → 45300.00
  const cleaned = valor.replace(/[^\d,]/g, "").replace(",", ".");
  return Number(cleaned);
}

function normalizeReferenceMonth(mes: string): string {
  // "março de 2025 " → "2025-03"
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

export class ParallelumProvider implements FipeProvider {
  readonly id = "parallelum" as const;

  async quote(query: FipeQuoteQuery): Promise<FipeQuoteResult | null> {
    // 1) Marca
    const brands = await safeJson<BrandResp[]>(`${BASE_URL}/${VEHICLE_TYPE}/marcas`);
    if (!brands) return null;
    const wantedBrand = normalizeText(query.brand);
    const brand = brands.find((b) => normalizeText(b.nome) === wantedBrand);
    if (!brand) return null;

    // 2) Modelos
    const models = await safeJson<ModelResp>(
      `${BASE_URL}/${VEHICLE_TYPE}/marcas/${brand.codigo}/modelos`,
    );
    if (!models?.modelos) return null;
    const wantedModel = normalizeText(query.model);
    // Match estrito: nome exato OU prefixo idêntico ao informado.
    const model =
      models.modelos.find((m) => normalizeText(m.nome) === wantedModel) ??
      models.modelos.find((m) => normalizeText(m.nome).startsWith(wantedModel + " ")) ??
      null;
    if (!model) return null;

    // 3) Anos do modelo
    const years = await safeJson<YearResp[]>(
      `${BASE_URL}/${VEHICLE_TYPE}/marcas/${brand.codigo}/modelos/${model.codigo}/anos`,
    );
    if (!years) return null;
    const yearCandidates = years.filter((y) => y.codigo.startsWith(`${query.year_model}-`));
    if (!yearCandidates.length) return null;

    // 4) Valor — escolhe combustível compatível quando informado
    for (const y of yearCandidates) {
      const value = await safeJson<ValueResp>(
        `${BASE_URL}/${VEHICLE_TYPE}/marcas/${brand.codigo}/modelos/${model.codigo}/anos/${y.codigo}`,
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
        vehicle_type: "cars",
        provider: this.id,
        raw_response: value,
      };

      // Match estrito final (marca+modelo+ano+combustível quando ambos têm)
      if (isStrictFipeMatch(result, query)) return result;
    }
    return null;
  }
}
