/**
 * Validador do Extraction Engine.
 * Define o status final de cada linha (valid / review / invalid)
 * a partir dos campos extraídos e da confiança.
 */
import type { ExtractedRowStatus, ExtractedVehicle } from "../types/extraction.types";

export interface ValidationOutcome {
  status: ExtractedRowStatus;
  errors: string[];
}

export function validateExtractedVehicle(row: ExtractedVehicle): ValidationOutcome {
  const errors: string[] = [];

  if (!row.brand) errors.push("Marca ausente");
  if (!row.model) errors.push("Modelo ausente");
  if (!row.year_model) errors.push("Ano/modelo ausente");
  if (row.price === null || row.price <= 0) errors.push("Preço ausente ou inválido");
  if (row.km === null || row.km < 0) errors.push("KM ausente ou inválido");

  const confidences = [
    row.confidence.brand,
    row.confidence.model,
    row.confidence.year_model,
    row.confidence.km,
    row.confidence.price,
  ];
  const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  let status: ExtractedRowStatus = "valid";
  if (errors.length >= 3) status = "invalid";
  else if (errors.length > 0 || avg < 70) status = "review";

  return { status, errors };
}

export function applyValidation(rows: ExtractedVehicle[]): ExtractedVehicle[] {
  return rows.map((r) => {
    const { status, errors } = validateExtractedVehicle(r);
    return { ...r, status, errors };
  });
}

export function averageConfidence(row: ExtractedVehicle): number {
  const c = row.confidence;
  return Math.round((c.brand + c.model + c.year_model + c.km + c.price) / 5);
}
