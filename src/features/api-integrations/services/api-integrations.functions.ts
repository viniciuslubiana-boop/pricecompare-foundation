/**
 * Server functions para Integrações por API Externa.
 * - CRUD com proteção de token (nunca retornado ao client).
 * - Test connection: chamada server-side, sem expor key.
 * - Run: busca, normaliza, roteia para Inventory/Competitor Engine.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  normalizeBrand,
  normalizeKm,
  normalizeModel,
  normalizePrice,
  normalizeYearModel,
} from "@/features/inventory/utils/inventory-normalization";
import { extractList, getByPath } from "../utils/field-mapper";
import type {
  ApiFieldMapping,
  ApiLogStatus,
  RunResult,
  TestConnectionResult,
} from "../types";

const FieldMapping = z.object({
  list_path: z.string().default(""),
  fields: z
    .object({
      brand: z.string().optional(),
      model: z.string().optional(),
      version: z.string().optional(),
      year_model: z.string().optional(),
      km: z.string().optional(),
      price: z.string().optional(),
      link: z.string().optional(),
      photo: z.string().optional(),
    })
    .default({}),
});

const IntegrationInput = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  target_type: z.enum(["my_stock", "competitor"]),
  base_company_id: z.string().uuid().nullable(),
  competitor_id: z.string().uuid().nullable(),
  url: z.string().url("URL inválida"),
  http_method: z.enum(["GET", "POST"]),
  auth_header_name: z.string().nullable(),
  auth_header_value: z.string().nullable(),
  extra_headers: z.record(z.string(), z.string()).default({}),
  body_template: z.unknown().nullable(),
  field_mapping: FieldMapping,
  frequency: z.enum(["manual", "daily", "weekly"]),
  status: z.enum(["active", "inactive"]),
});

const TIMEOUT_MS = 20_000;

async function callExternal(
  url: string,
  method: "GET" | "POST",
  headers: Record<string, string>,
  body: unknown | null,
): Promise<{ status: number; ok: boolean; json: unknown; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers: { Accept: "application/json", ...headers },
      body: method === "POST" && body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, ok: res.ok, json, text };
  } finally {
    clearTimeout(timer);
  }
}

function classifyHttp(status: number, parsed: unknown): ApiLogStatus | null {
  if (status === 401 || status === 403) return "auth_error";
  if (status >= 500 || status === 0) return "unavailable";
  if (!parsed) return "format_error";
  return null;
}

interface NormalizedRow {
  brand: string;
  model: string;
  year_model: string;
  km: number;
  price: number;
  link: string | null;
  photo: string | null;
}

function applyMapping(list: unknown[], mapping: ApiFieldMapping): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const version = mapping.fields.version
      ? String(getByPath(raw, mapping.fields.version) ?? "")
      : "";
    const modelRaw = String(getByPath(raw, mapping.fields.model ?? "") ?? "");
    const model = normalizeModel(version ? `${modelRaw} ${version}`.trim() : modelRaw);
    const brand = normalizeBrand(String(getByPath(raw, mapping.fields.brand ?? "") ?? ""));
    const year_model = normalizeYearModel(
      String(getByPath(raw, mapping.fields.year_model ?? "") ?? ""),
    );
    const km = normalizeKm(getByPath(raw, mapping.fields.km ?? "") as string | number | null);
    const price = normalizePrice(
      getByPath(raw, mapping.fields.price ?? "") as string | number | null,
    );
    const link = mapping.fields.link
      ? String(getByPath(raw, mapping.fields.link) ?? "") || null
      : null;
    const photo = mapping.fields.photo
      ? String(getByPath(raw, mapping.fields.photo) ?? "") || null
      : null;
    if (!brand || !model || !price) continue;
    out.push({ brand, model, year_model, km, price, link, photo });
  }
  return out;
}

// ============================================================
// CRUD
// ============================================================

export const createApiIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => IntegrationInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("api_integrations")
      .insert({
        user_id: context.userId,
        name: data.name,
        target_type: data.target_type,
        base_company_id: data.base_company_id,
        competitor_id: data.competitor_id,
        url: data.url,
        http_method: data.http_method,
        auth_header_name: data.auth_header_name,
        auth_header_value: data.auth_header_value,
        extra_headers: data.extra_headers as never,
        body_template: data.body_template as never,
        field_mapping: data.field_mapping as never,
        frequency: data.frequency,
        status: data.status,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const UpdateInput = IntegrationInput.extend({ id: z.string().uuid() });

export const updateApiIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {
      name: data.name,
      target_type: data.target_type,
      base_company_id: data.base_company_id,
      competitor_id: data.competitor_id,
      url: data.url,
      http_method: data.http_method,
      auth_header_name: data.auth_header_name,
      extra_headers: data.extra_headers,
      body_template: data.body_template,
      field_mapping: data.field_mapping,
      frequency: data.frequency,
      status: data.status,
    };
    // Só atualiza token se vier preenchido
    if (data.auth_header_value && data.auth_header_value.trim()) {
      patch.auth_header_value = data.auth_header_value;
    }
    const { error } = await context.supabase
      .from("api_integrations")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApiIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("api_integrations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Test connection / Run
// ============================================================

async function loadIntegration(
  supabase: ReturnType<typeof Object> extends never ? never : ReturnType<typeof Object>,
  id: string,
): Promise<Record<string, unknown>> {
  void supabase;
  throw new Error("unused");
}
void loadIntegration;

export const testApiIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<TestConnectionResult> => {
    const { data: row, error } = await context.supabase
      .from("api_integrations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) {
      return {
        ok: false,
        status: "failed",
        http_status: null,
        message: error?.message ?? "Integração não encontrada.",
        sample: null,
        vehicles_count: 0,
      };
    }
    const headers: Record<string, string> = { ...(row.extra_headers as Record<string, string>) };
    if (row.auth_header_name && row.auth_header_value) {
      headers[row.auth_header_name] = row.auth_header_value;
    }
    try {
      const res = await callExternal(
        row.url,
        row.http_method as "GET" | "POST",
        headers,
        row.body_template,
      );
      const httpClass = classifyHttp(res.status, res.json);
      if (httpClass === "auth_error") {
        return {
          ok: false,
          status: "auth_error",
          http_status: res.status,
          message: "Erro de autenticação. Verifique o token / API Key.",
          sample: res.text.slice(0, 500),
          vehicles_count: 0,
        };
      }
      if (httpClass === "unavailable") {
        return {
          ok: false,
          status: "unavailable",
          http_status: res.status,
          message: `API indisponível (HTTP ${res.status}).`,
          sample: res.text.slice(0, 500),
          vehicles_count: 0,
        };
      }
      if (httpClass === "format_error") {
        return {
          ok: false,
          status: "format_error",
          http_status: res.status,
          message: "Resposta não é JSON válido.",
          sample: res.text.slice(0, 500),
          vehicles_count: 0,
        };
      }
      const mapping = row.field_mapping as unknown as ApiFieldMapping;
      const list = extractList(res.json, mapping?.list_path ?? "");
      if (!list.length) {
        return {
          ok: true,
          status: "empty",
          http_status: res.status,
          message:
            "Conexão OK, mas nenhum veículo encontrado no caminho informado. Revise o list_path.",
          sample: res.json,
          vehicles_count: 0,
        };
      }
      return {
        ok: true,
        status: "success",
        http_status: res.status,
        message: `Conexão OK. ${list.length} item(ns) encontrados.`,
        sample: list.slice(0, 3),
        vehicles_count: list.length,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: "unavailable",
        http_status: null,
        message: `Falha ao chamar a API: ${msg}`,
        sample: null,
        vehicles_count: 0,
      };
    }
  });

export const runApiIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<RunResult> => {
    const startedAt = new Date();
    const { data: row, error } = await context.supabase
      .from("api_integrations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) {
      return {
        status: "failed",
        vehicles_received: 0,
        vehicles_imported: 0,
        message: error?.message ?? "Integração não encontrada.",
      };
    }

    if (row.target_type === "my_stock" && !row.base_company_id) {
      return {
        status: "failed",
        vehicles_received: 0,
        vehicles_imported: 0,
        message: "Integração de Meu Estoque exige Empresa Base vinculada.",
      };
    }
    if (row.target_type === "competitor" && !row.competitor_id) {
      return {
        status: "failed",
        vehicles_received: 0,
        vehicles_imported: 0,
        message: "Integração de Concorrente exige Concorrente vinculado.",
      };
    }

    const headers: Record<string, string> = { ...(row.extra_headers as Record<string, string>) };
    if (row.auth_header_name && row.auth_header_value) {
      headers[row.auth_header_name] = row.auth_header_value;
    }

    let finalStatus: ApiLogStatus = "failed";
    let received = 0;
    let imported = 0;
    let httpStatus: number | null = null;
    let errorMessage: string | null = null;

    try {
      const res = await callExternal(
        row.url,
        row.http_method as "GET" | "POST",
        headers,
        row.body_template,
      );
      httpStatus = res.status;
      const cls = classifyHttp(res.status, res.json);
      if (cls) {
        finalStatus = cls;
        errorMessage =
          cls === "auth_error"
            ? "Erro de autenticação."
            : cls === "unavailable"
              ? `API indisponível (HTTP ${res.status}).`
              : "Resposta não é JSON válido.";
      } else {
        const mapping = row.field_mapping as unknown as ApiFieldMapping;
        const list = extractList(res.json, mapping?.list_path ?? "");
        received = list.length;
        if (!list.length) {
          finalStatus = "empty";
          errorMessage = "Nenhum veículo encontrado.";
        } else {
          const rows = applyMapping(list, mapping);

          // Dedup por chave brand|model|year
          const seen = new Set<string>();
          const dedup = rows.filter((r) => {
            const k = `${r.brand}|${r.model}|${r.year_model}`.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });

          if (row.target_type === "my_stock") {
            const payload = dedup.map((r) => ({
              brand: r.brand,
              model: r.model,
              year_model: r.year_model,
              km: r.km,
              price: r.price,
              supplier_name: null,
              source: "api",
              created_by: context.userId,
              base_company_id: row.base_company_id,
            }));
            const { data: inserted, error: insErr } = await context.supabase
              .from("my_vehicles")
              .insert(payload as never)
              .select("id");
            if (insErr) throw new Error(insErr.message);
            imported = inserted?.length ?? 0;
          } else {
            // competitor
            const { data: comp } = await context.supabase
              .from("competitors")
              .select("name")
              .eq("id", row.competitor_id!)
              .single();
            const payload = dedup.map((r) => ({
              brand: r.brand,
              model: r.model,
              year_model: r.year_model,
              km: r.km,
              price: r.price,
              source_url: r.link ?? row.url,
              competitor_name: comp?.name ?? row.name,
              confidence: { brand: 95, model: 90, year_model: 90, km: 90, price: 100, average: 93 },
            }));
            const { data: inserted, error: insErr } = await context.supabase
              .from("competitor_vehicles")
              .insert(payload as never)
              .select("id");
            if (insErr) throw new Error(insErr.message);
            imported = inserted?.length ?? 0;
          }
          finalStatus = imported > 0 ? "success" : "empty";
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      finalStatus = "failed";
      errorMessage = msg;
    }

    const finishedAt = new Date();
    await context.supabase.from("api_integration_logs").insert({
      integration_id: row.id,
      user_id: context.userId,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      url_called: row.url,
      http_status: httpStatus,
      status: finalStatus,
      vehicles_received: received,
      vehicles_imported: imported,
      error_message: errorMessage,
    });

    if (finalStatus === "success" || finalStatus === "empty") {
      await context.supabase
        .from("api_integrations")
        .update({ last_run_at: finishedAt.toISOString() })
        .eq("id", row.id);
    }

    return {
      status: finalStatus,
      vehicles_received: received,
      vehicles_imported: imported,
      message:
        finalStatus === "success"
          ? `${imported} veículo(s) importados de ${received} recebido(s).`
          : errorMessage ?? "Execução concluída.",
    };
  });
