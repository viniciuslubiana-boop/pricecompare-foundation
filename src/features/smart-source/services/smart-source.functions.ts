import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pickBest } from "../smart-source.engine";
import {
  SourceMethod,
  type SmartSourceInput,
  type SmartSourceSelection,
  type SourceCandidate,
  type SourceExecutionInput,
  type SourceProfileRow,
} from "../types";

const ALLOWED_METHODS = Object.values(SourceMethod) as [string, ...string[]];

const selectSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  companyType: z.enum(["base_company", "competitor"]),
  url: z.string().min(1),
  technology: z.string().optional(),
}) satisfies z.ZodType<SmartSourceInput>;

const executionSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  companyType: z.enum(["base_company", "competitor"]),
  url: z.string().min(1),
  methodUsed: z.enum(ALLOWED_METHODS),
  confidence: z.number().min(0).max(100),
  vehiclesFound: z.number().int().nonnegative(),
  executionTimeMs: z.number().int().nonnegative(),
  success: z.boolean(),
  fallbackUsed: z.boolean(),
  fallbackChain: z
    .array(
      z.object({
        method: z.enum(ALLOWED_METHODS),
        priority: z.number(),
        confidence: z.number(),
        technology: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
});

async function loadProfiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  technology: string,
): Promise<SourceProfileRow[]> {
  const { data, error } = await supabase
    .from("market_source_profiles")
    .select("*")
    .eq("technology", technology)
    .eq("active", true)
    .order("priority", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SourceProfileRow[];
}

async function resolveTechnology(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  url: string,
  hint?: string,
): Promise<string> {
  if (hint && hint.trim()) return hint;
  const { data } = await supabase
    .from("site_discovery")
    .select("technology, detected_at")
    .eq("url", url)
    .order("detected_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.technology ?? "Desconhecida";
}

export const selectSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => selectSchema.parse(data))
  .handler(async ({ data, context }): Promise<SmartSourceSelection> => {
    const technology = await resolveTechnology(context.supabase, data.url, data.technology);
    const profiles = await loadProfiles(context.supabase, technology);
    const { chosen, fallbackChain } = pickBest(technology, profiles);
    return { url: data.url, technology, chosen, fallbackChain };
  });

export const recordSourceExecution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => executionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error: histErr } = await context.supabase
      .from("market_source_history")
      .insert({
        company_id: data.companyId ?? null,
        company_type: data.companyType,
        url: data.url,
        method_used: data.methodUsed as SourceMethod,
        confidence: data.confidence,
        vehicles_found: data.vehiclesFound,
        execution_time_ms: data.executionTimeMs,
        success: data.success,
        fallback_used: data.fallbackUsed,
        fallback_chain: (data.fallbackChain ?? null) as never,
      });
    if (histErr) throw new Error(histErr.message);

    // Aprendizado: ajusta perfil correspondente quando existir.
    const technology = (data.fallbackChain?.[0]?.technology as string | undefined) ?? null;
    if (technology) {
      const { data: profile } = await context.supabase
        .from("market_source_profiles")
        .select("id, priority, confidence")
        .eq("technology", technology)
        .eq("source_method", data.methodUsed)
        .maybeSingle();

      if (profile) {
        const currentPriority = profile.priority as number;
        const currentConfidence = Number(profile.confidence);
        const nextPriority = clamp(
          currentPriority + (data.success ? 2 : -3),
          0,
          1000,
        );
        const nextConfidence = clamp(
          currentConfidence + (data.success ? 1 : -2),
          0,
          100,
        );
        await context.supabase
          .from("market_source_profiles")
          .update({ priority: nextPriority, confidence: nextConfidence })
          .eq("id", profile.id);
      }
    }
    return { ok: true };
  });

export const listSourceHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("market_source_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listSourceProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("market_source_profiles")
      .select("*")
      .order("technology", { ascending: true })
      .order("priority", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type { SourceCandidate };
