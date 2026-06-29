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

/** Resultado de atualização de um único veículo. */
export interface FipeVehicleUpdateOutcome {
  vehicle_id: string;
  status: FipeStatus;
  fipe_value?: number;
  fipe_code?: string | null;
  reference_month?: string;
  reason?: string;
}

export interface FipeUpdateRunResult {
  log_id: string;
  total_vehicles: number;
  matched: number;
  unmatched: number;
  errors: number;
  outcomes: FipeVehicleUpdateOutcome[];
}
