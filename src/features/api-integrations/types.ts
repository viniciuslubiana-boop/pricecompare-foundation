export type ApiTargetType = "my_stock" | "competitor";
export type ApiHttpMethod = "GET" | "POST";
export type ApiFrequency = "manual" | "daily" | "weekly";
export type ApiIntegrationStatus = "active" | "inactive";

export type ApiLogStatus =
  | "success"
  | "auth_error"
  | "format_error"
  | "unavailable"
  | "empty"
  | "failed";

export interface ApiFieldMapping {
  list_path: string;
  fields: {
    brand?: string;
    model?: string;
    version?: string;
    year_model?: string;
    km?: string;
    price?: string;
    link?: string;
    photo?: string;
  };
}

export interface ApiIntegrationPublic {
  id: string;
  user_id: string;
  name: string;
  target_type: ApiTargetType;
  base_company_id: string | null;
  competitor_id: string | null;
  url: string;
  http_method: ApiHttpMethod;
  auth_header_name: string | null;
  has_auth_header_value: boolean;
  extra_headers: Record<string, string>;
  body_template: unknown | null;
  field_mapping: ApiFieldMapping;
  frequency: ApiFrequency;
  status: ApiIntegrationStatus;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiIntegrationInput {
  name: string;
  target_type: ApiTargetType;
  base_company_id: string | null;
  competitor_id: string | null;
  url: string;
  http_method: ApiHttpMethod;
  auth_header_name: string | null;
  /** Quando vazio em update, mantém valor existente. */
  auth_header_value: string | null;
  extra_headers: Record<string, string>;
  body_template: unknown | null;
  field_mapping: ApiFieldMapping;
  frequency: ApiFrequency;
  status: ApiIntegrationStatus;
}

export interface ApiIntegrationLog {
  id: string;
  integration_id: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  url_called: string | null;
  http_status: number | null;
  status: ApiLogStatus;
  vehicles_received: number;
  vehicles_imported: number;
  error_message: string | null;
}

export interface TestConnectionResult {
  ok: boolean;
  status: ApiLogStatus;
  http_status: number | null;
  message: string;
  sample: string;
  vehicles_count: number;
}


export interface RunResult {
  status: ApiLogStatus;
  vehicles_received: number;
  vehicles_imported: number;
  message: string;
}
