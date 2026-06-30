// Site Discovery Engine — types
import type { AcquisitionCompanyType } from "@/features/market-acquisition/types";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };


export type DetectedTechnology =
  | "RevendaMais"
  | "DealerSites"
  | "WordPress"
  | "React"
  | "Next.js"
  | "Vue"
  | "Angular"
  | "Shopify"
  | "PHP"
  | "ASP.NET"
  | "Laravel"
  | "Plataforma Própria"
  | "Desconhecida";

export interface SiteFetchResult {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  headers: Record<string, string>;
  robotsTxt?: string | null;
  sitemapXml?: string | null;
}

export interface DetectionMatch {
  technology: DetectedTechnology;
  confidence: number; // 0–100
  htmlSignature?: JsonValue;
  frameworkSignature?: JsonValue;
}


export interface SiteDiscoveryResult extends DetectionMatch {
  url: string;
  detectedAt: string;
  discoveryTimeMs: number;
}

export interface SiteDiscoveryInput {
  companyId?: string | null;
  companyType: AcquisitionCompanyType;
  url: string;
  persist?: boolean;
}

export interface SiteDiscoveryRow {
  id: string;
  company_id: string | null;
  company_type: AcquisitionCompanyType;
  url: string;
  technology: DetectedTechnology;
  confidence: number;
  html_signature: JsonValue | null;
  framework_signature: JsonValue | null;
  discovery_time_ms: number | null;
  detected_at: string;
  created_at: string;
  updated_at: string;
}

