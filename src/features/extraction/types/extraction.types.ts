/**
 * Tipos do Extraction Engine.
 * Representa veículos extraídos (de texto/HTML) de um concorrente,
 * antes da confirmação e do salvamento em `competitor_vehicles`.
 */

export type ExtractedRowStatus = "valid" | "review" | "invalid";

export interface ExtractedConfidence {
  brand: number;
  model: number;
  year_model: number;
  km: number;
  price: number;
}

export interface ExtractedVehicle {
  /** id local apenas para edição/preview */
  tempId: string;
  brand: string;
  model: string;
  year_model: string;
  km: number | null;
  price: number | null;
  source_url: string | null;
  competitor_name: string | null;
  confidence: ExtractedConfidence;
  raw_text: string;
  status: ExtractedRowStatus;
  errors: string[];
}

export interface ExtractionPreviewResult {
  rows: ExtractedVehicle[];
  totals: {
    total: number;
    valid: number;
    review: number;
    invalid: number;
  };
}

export interface ExtractionInput {
  competitorId: string;
  competitorName: string;
  competitorUrl: string | null;
  rawContent: string;
  inputType: "text" | "html";
}
