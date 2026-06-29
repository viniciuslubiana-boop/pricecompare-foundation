/**
 * Tipos do módulo FIPE.
 * FIPE é referência de mercado adicional — nunca substitui Comparison Engine.
 */

export type FipeProviderId = "parallelum" | "commercial";

export type FipeStatus =
  | "nao_verificada"
  | "encontrada"
  | "nao_encontrada"
  | "vinculada_manualmente"
  | "desatualizada";

export type FipeLinkMode = "auto" | "manual";

export type FipeSegment = "carros" | "motos" | "caminhoes";

export type FipeDiagnosticReason =
  | "marca_nao_encontrada"
  | "modelo_nao_encontrado"
  | "ano_nao_encontrado"
  | "combustivel_incompativel"
  | "tokens_incompativeis"
  | "segmento_incorreto"
  | "erro_api"
  | "aprovado";

/** Resultado normalizado retornado por qualquer provedor FIPE. */
export interface FipeQuoteResult {
  fipe_code: string | null;
  brand: string;
  model: string;
  version: string | null;
  year_model: number;
  fuel: string | null;
  fipe_value: number;
  reference_month: string;
  vehicle_type: "cars" | "motorcycles" | "trucks";
  provider: FipeProviderId;
  raw_response?: Record<string, unknown> | null;
}

/** Entrada genérica para o provedor consultar a FIPE. */
export interface FipeQuoteQuery {
  brand: string;
  model: string;
  year_model: number;
  fuel?: string | null;
  fipe_code?: string | null;
}

export interface FipeMatchDiagnostics {
  original_brand: string;
  original_model: string;
  original_year_model: number | string | null;
  normalized_brand: string;
  normalized_model: string;
  detected_type: FipeQuoteResult["vehicle_type"] | null;
  segments_attempted: FipeSegment[];
  segment_used: FipeSegment | null;
  fipe_brand_found: string | null;
  fipe_candidates_found: string[];
  chosen_fipe_model: string | null;
  fipe_year_evaluated: string | number | null;
  fipe_value_returned: number | null;
  final_status: FipeStatus;
  rejection_reason: FipeDiagnosticReason;
  provider: FipeProviderId;
  brand_alias_applied?: string | null;
  model_alias_applied?: string | null;
}

export interface FipeQuoteWithDiagnostics {
  result: FipeQuoteResult | null;
  diagnostics: FipeMatchDiagnostics;
}

/** Resultado de atualização de um único veículo. */
export interface FipeVehicleUpdateOutcome {
  vehicle_id: string;
  status: FipeStatus;
  fipe_value?: number;
  fipe_code?: string | null;
  reference_month?: string;
  reason?: string;
  diagnostics?: FipeMatchDiagnostics;
}

export interface FipeUpdateRunResult {
  log_id: string;
  total_vehicles: number;
  matched: number;
  unmatched: number;
  errors: number;
  outcomes: FipeVehicleUpdateOutcome[];
}
