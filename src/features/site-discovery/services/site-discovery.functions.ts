import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runDetectors } from "../detectors";
import type {
  SiteDiscoveryResult,
  SiteFetchResult,
  DetectedTechnology,
} from "../types";

const TIMEOUT_MS = 12_000;

function isPrivateOrBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  )
    return true;
  if (h === "127.0.0.1" || h === "::1" || h === "0.0.0.0") return true;
  const parts = h.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }
  return false;
}

function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Apenas URLs http(s) são permitidas.");
  }
  if (isPrivateOrBlockedHost(parsed.hostname)) {
    throw new Error("URL aponta para um host interno e foi bloqueada.");
  }
  return parsed;
}

async function safeFetchText(url: string): Promise<{
  status: number;
  text: string;
  headers: Record<string, string>;
  finalUrl: string;
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "PCM-SiteDiscovery/1.0",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    return { status: res.status, text, headers, finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSite(rawUrl: string): Promise<SiteFetchResult> {
  const safe = assertSafeUrl(rawUrl);
  const main = await safeFetchText(safe.toString());
  if (!main) {
    throw new Error("Falha ao acessar o site informado.");
  }
  const origin = `${safe.protocol}//${safe.host}`;
  const [robots, sitemap] = await Promise.all([
    safeFetchText(`${origin}/robots.txt`),
    safeFetchText(`${origin}/sitemap.xml`),
  ]);
  return {
    url: safe.toString(),
    finalUrl: main.finalUrl,
    status: main.status,
    html: main.text,
    headers: main.headers,
    robotsTxt: robots?.text ?? null,
    sitemapXml: sitemap?.text ?? null,
  };
}

const inputSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  companyType: z.enum(["base_company", "competitor"]),
  url: z.string().min(1),
  persist: z.boolean().optional(),
});

export const discoverSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<SiteDiscoveryResult> => {
    const startedAt = Date.now();
    const fetched = await fetchSite(data.url);
    const match = runDetectors(fetched);
    const finishedAt = Date.now();

    const result: SiteDiscoveryResult = {
      ...match,
      url: fetched.finalUrl,
      detectedAt: new Date(finishedAt).toISOString(),
      discoveryTimeMs: finishedAt - startedAt,
    };

    if (data.persist !== false) {
      const { error } = await context.supabase.from("site_discovery").insert({
        company_id: data.companyId ?? null,
        company_type: data.companyType,
        url: result.url,
        technology: result.technology satisfies DetectedTechnology,
        confidence: result.confidence,
        html_signature: result.htmlSignature ?? null,
        framework_signature: result.frameworkSignature ?? null,
        discovery_time_ms: result.discoveryTimeMs,
        detected_at: result.detectedAt,
      });
      if (error) {
        // Não falhar a descoberta por erro de persistência.
        console.error("[site-discovery] persist error", error);
      }
    }

    return result;
  });

export const listSiteDiscoveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_discovery")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
