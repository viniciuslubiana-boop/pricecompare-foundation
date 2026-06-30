// Market Acquisition Engine (MAE) — types & enums
// Sprint 001: arquitetura apenas, sem implementação de extração.

export enum AcquisitionMethod {
  API = "API",
  JSON = "JSON",
  HTML = "HTML",
  RENDERED_HTML = "RENDERED_HTML",
  FILE_IMPORT = "FILE_IMPORT",
}

export type AcquisitionCompanyType = "base_company" | "competitor";

export type AcquisitionStatus =
  | "pending"
  | "running"
  | "success"
  | "partial"
  | "failed";

export interface AcquisitionContext {
  companyId: string | null;
  companyType: AcquisitionCompanyType;
  url?: string | null;
  method: AcquisitionMethod;
  /** Configuração arbitrária do provider (headers, mapping, etc). */
  config?: Record<string, unknown>;
}

export interface RawAcquisitionPayload {
  method: AcquisitionMethod;
  /** Conteúdo bruto retornado pelo provider (texto, JSON, HTML…). */
  content: unknown;
  /** Metadados auxiliares (status HTTP, headers relevantes, etc.). */
  meta?: Record<string, unknown>;
}

export interface ExtractedVehicleDraft {
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  mileage?: number | null;
  price?: number | null;
  link?: string | null;
  photo?: string | null;
  raw?: Record<string, unknown>;
}

export interface NormalizedVehicle extends ExtractedVehicleDraft {
  normalized: true;
}

export interface AcquisitionRunResult {
  status: AcquisitionStatus;
  vehiclesFound: number;
  vehiclesSaved: number;
  errorMessage?: string | null;
  startedAt: string;
  finishedAt: string;
}

export interface MarketAcquisitionLogRow {
  id: string;
  company_id: string | null;
  company_type: AcquisitionCompanyType;
  url: string | null;
  method: AcquisitionMethod;
  status: AcquisitionStatus;
  started_at: string;
  finished_at: string | null;
  vehicles_found: number;
  vehicles_saved: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
