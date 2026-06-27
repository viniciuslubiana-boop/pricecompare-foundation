/**
 * Parser do Extraction Engine.
 * Recebe texto bruto (ou HTML convertido) e tenta identificar veículos
 * por meio de heurísticas simples: preço, ano, km e linha de título.
 *
 * Não acessa rede, não chama IA. Apenas regex + heurísticas.
 */
import {
  htmlToText,
  normalizeBrand,
  normalizeKm,
  normalizeModel,
  normalizePrice,
  normalizeYearModel,
} from "../normalizers/extraction.normalizer";
import type {
  ExtractedConfidence,
  ExtractedVehicle,
  ExtractionInput,
} from "../types/extraction.types";

const PRICE_RE = /R\$\s*([\d.]+(?:,\d{1,2})?)/i;
const YEAR_RE = /\b(19|20)\d{2}\s*\/\s*\d{2,4}\b|\b(19|20)\d{2}\b/;
const KM_RE = /([\d.,]+)\s*km\b/i;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Divide o conteúdo em blocos candidatos a veículo. */
function splitBlocks(text: string): string[] {
  const byDouble = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  // Se quase tudo veio numa linha só, tenta quebrar por "R$"
  if (byDouble.length <= 1 && /R\$/.test(text)) {
    const parts = text.split(/(?=R\$\s*\d)/).map((b) => b.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  return byDouble;
}

/** Tenta identificar a linha-título (marca/modelo) do bloco. */
function pickTitleLine(block: string): string {
  const lines = block
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);
  if (!lines.length) return block.trim();
  // primeira linha que NÃO seja apenas preço/ano/km
  for (const l of lines) {
    if (PRICE_RE.test(l) && l.length < 20) continue;
    if (/^\d{4}/.test(l) && l.length < 12) continue;
    if (KM_RE.test(l) && l.length < 20) continue;
    return l;
  }
  return lines[0];
}

/** Remove pedaços de ruído da linha de título para isolar marca/modelo. */
function cleanTitleLine(line: string): string {
  return line
    .replace(PRICE_RE, " ")
    .replace(YEAR_RE, " ")
    .replace(KM_RE, " ")
    .replace(/[•|·–—\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedBlock {
  brand: string;
  model: string;
  year_model: string;
  km: number | null;
  price: number | null;
  confidence: ExtractedConfidence;
  raw_text: string;
}

function parseBlock(block: string): ParsedBlock {
  const confidence: ExtractedConfidence = {
    brand: 0,
    model: 0,
    year_model: 0,
    km: 0,
    price: 0,
  };

  const priceMatch = block.match(PRICE_RE);
  const yearMatch = block.match(YEAR_RE);
  const kmMatch = block.match(KM_RE);

  const price = priceMatch ? normalizePrice(priceMatch[1]) : null;
  const yearRaw = yearMatch ? yearMatch[0] : "";
  const year_model = normalizeYearModel(yearRaw);
  const km = kmMatch ? normalizeKm(kmMatch[1]) : null;

  if (price && price > 0) confidence.price = 95;
  if (year_model) confidence.year_model = yearMatch?.[0]?.includes("/") ? 95 : 75;
  if (km !== null && km > 0) confidence.km = 90;

  const title = cleanTitleLine(pickTitleLine(block));
  const tokens = title.split(/\s+/).filter(Boolean);
  let brand = "";
  let model = "";
  if (tokens.length >= 2) {
    brand = normalizeBrand(tokens[0]);
    model = normalizeModel(tokens.slice(1).join(" "));
    confidence.brand = 70;
    confidence.model = 70;
  } else if (tokens.length === 1) {
    brand = normalizeBrand(tokens[0]);
    confidence.brand = 50;
  }

  return {
    brand,
    model,
    year_model,
    km,
    price,
    confidence,
    raw_text: block,
  };
}

export function parseExtractionInput(input: ExtractionInput): ExtractedVehicle[] {
  const text =
    input.inputType === "html" ? htmlToText(input.rawContent) : input.rawContent;
  const blocks = splitBlocks(text);

  return blocks
    .map((block) => parseBlock(block))
    // descarta blocos sem nenhum sinal (sem marca, preço, ano ou km)
    .filter(
      (p) =>
        p.brand || p.price !== null || p.year_model || (p.km !== null && p.km > 0),
    )
    .map<ExtractedVehicle>((p) => ({
      tempId: uid(),
      brand: p.brand,
      model: p.model,
      year_model: p.year_model,
      km: p.km,
      price: p.price,
      source_url: input.competitorUrl,
      competitor_name: input.competitorName,
      confidence: p.confidence,
      raw_text: p.raw_text,
      status: "review",
      errors: [],
    }));
}
