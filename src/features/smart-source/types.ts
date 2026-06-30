// Smart Source Selector — types
import type { AcquisitionCompanyType } from "@/features/market-acquisition/types";
import type { DetectedTechnology, JsonValue } from "@/features/site-discovery/types";


export enum SourceMethod {
  PLATFORM_PROFILE = "PLATFORM_PROFILE",
  OFFICIAL_API = "OFFICIAL_API",
  PUBLIC_API = "PUBLIC_API",
  GRAPHQL = "GRAPHQL",
  JSON = "JSON",
  EMBEDDED_JSON = "EMBEDDED_JSON",
  XML = "XML",
  SITEMAP = "SITEMAP",
  HTML = "HTML",
  RENDERED_HTML = "RENDERED_HTML",
  FILE_IMPORT = "FILE_IMPORT",
  UNKNOWN = "UNKNOWN",
}

export type SourceQuality = "excelente" | "boa" | "regular" | "ruim" | "indefinida";

export interface SourceProfileRow {
  id: string;
  technology: string;
  source_method: SourceMethod;
  priority: number;
  confidence: number;
  selector_strategy: JsonValue | null;
  pagination_strategy: JsonValue | null;
  vehicle_card_strategy: JsonValue | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceHistoryRow {
  id: string;
  company_id: string | null;
  company_type: AcquisitionCompanyType;
  url: string;
  method_used: SourceMethod;
  confidence: number;
  vehicles_found: number;
  execution_time_ms: number | null;
  success: boolean;
  fallback_used: boolean;
  fallback_chain: JsonValue | null;
  created_at: string;
}

export interface SourceCandidate {
  method: SourceMethod;
  priority: number;
  confidence: number;
  technology: DetectedTechnology | string;
  reason: string;
}

export interface SmartSourceSelection {
  url: string;
  technology: DetectedTechnology | string;
  chosen: SourceCandidate;
  fallbackChain: SourceCandidate[];
  usedHistory?: boolean;
  reason?: string;
  scores?: Array<{
    method: string;
    score: number;
    successRate: number;
    executions: number;
  }>;
}


export interface SmartSourceInput {
  companyId?: string | null;
  companyType: AcquisitionCompanyType;
  url: string;
  technology?: DetectedTechnology | string;
}

export interface SourceExecutionInput {
  companyId?: string | null;
  companyType: AcquisitionCompanyType;
  url: string;
  methodUsed: SourceMethod;
  confidence: number;
  vehiclesFound: number;
  executionTimeMs: number;
  success: boolean;
  fallbackUsed: boolean;
  fallbackChain?: SourceCandidate[];
}
