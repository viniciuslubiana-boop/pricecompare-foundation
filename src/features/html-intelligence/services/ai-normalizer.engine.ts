// HIE — AI Normalizer (Sprint 005)
// Server-only. Recebe itens brutos do Technical Preview e devolve
// veículos normalizados no padrão PCM com confidence por campo.

import { z } from "zod";
import type { RawVehicleItem } from "../types";
import type {
  AiNormalizationOutcome,
  NormalizedVehiclePreview,
  PerFieldConfidence,
} from "../types";

const MAX_ITEMS_TO_AI = 30;
const MAX_RAW_TEXT_LEN = 600;
const AI_TIMEOUT_MS = 45_000;
const AI_MODEL = "google/gemini-2.5-flash-lite";

const confidenceSchema = z.object({
  brand: z.number().min(0).max(100).default(0),
  model: z.number().min(0).max(100).default(0),
  version: z.number().min(0).max(100).default(0),
  year_model: z.number().min(0).max(100).default(0),
  km: z.number().min(0).max(100).default(0),
  price: z.number().min(0).max(100).default(0),
  source_url: z.number().min(0).max(100).default(0),
  image_url: z.number().min(0).max(100).default(0),
});

const itemSchema = z.object({
  brand: z.string().nullable(),
  model: z.string().nullable(),
  version: z.string().nullable(),
  year_model: z.string().nullable(),
  km: z.union([z.number(), z.string()]).nullable(),
  price: z.union([z.number(), z.string()]).nullable(),
  source_url: z.string().nullable(),
  image_url: z.string().nullable(),
  store_name: z.string().nullable(),
  city: z.string().nullable(),
  source: z.string().nullable(),
  confidence: confidenceSchema,
});

const responseSchema = z.object({
  items: z.array(itemSchema),
});

function buildPrompt(items: RawVehicleItem[], sourceContext: string): string {
  const compact = items.map((it, idx) => ({
    idx,
    title: it.title,
    price: it.price,
    year: it.year,
    km: it.km,
    link: it.link,
    image: it.image,
    source: it.source,
    raw: (it.rawText ?? "").slice(0, MAX_RAW_TEXT_LEN),
  }));
  return [
    "Você é um normalizador de anúncios automotivos brasileiros.",
    "Receba os itens brutos abaixo (raspados de uma página de estoque) e devolva",
    "JSON estrito com a chave 'items'. Cada item deve ter EXATAMENTE estes campos:",
    "brand, model, version, year_model, km, price, source_url, image_url, store_name, city, source, confidence.",
    "Regras:",
    "- Não invente. Campo ausente vira null.",
    "- 'brand' em Title Case (ex.: 'Toyota', 'Volkswagen').",
    "- 'model' sem o ano e sem versão (ex.: 'Corolla').",
    "- 'version' separado (ex.: 'XEi 2.0 Flex').",
    "- 'year_model' no formato 'YYYY' ou 'YYYY/YYYY'.",
    "- 'km' inteiro em quilômetros (number). 'price' em reais (number).",
    "- 'source_url' / 'image_url' completos (https://...).",
    "- 'confidence' por campo, 0-100 (90+ aprovado, 70-89 revisar, <70 inválido).",
    `- Contexto da fonte: ${sourceContext}`,
    "Itens brutos:",
    JSON.stringify(compact),
  ].join("\n");
}

interface AiCallStats {
  durationMs: number;
  tokens: number;
  model: string;
}

interface AiRawItem {
  brand: string | null;
  model: string | null;
  version: string | null;
  year_model: string | null;
  km: number | string | null;
  price: number | string | null;
  source_url: string | null;
  image_url: string | null;
  store_name: string | null;
  city: string | null;
  source: string | null;
  confidence: PerFieldConfidence;
}

async function callAiGateway(
  prompt: string,
): Promise<{ items: AiRawItem[]; stats: AiCallStats }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Você devolve apenas JSON válido. Sem comentários, sem markdown.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    const durationMs = Date.now() - startedAt;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = responseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      throw new Error("Resposta da IA não validou no schema");
    }
    return {
      items: parsed.data.items as AiRawItem[],
      stats: {
        durationMs,
        tokens: json.usage?.total_tokens ?? 0,
        model: AI_MODEL,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runAiNormalization(
  items: RawVehicleItem[],
  sourceContext: string,
): Promise<AiNormalizationOutcome> {
  if (!items || items.length === 0) {
    return {
      items: [],
      aiUsed: false,
      aiModel: null,
      aiTokens: 0,
      aiDurationMs: 0,
      errors: [],
    };
  }
  const sliced = items.slice(0, MAX_ITEMS_TO_AI);
  const prompt = buildPrompt(sliced, sourceContext);

  try {
    const { items: aiItems, stats } = await callAiGateway(prompt);

    const normalized: NormalizedVehiclePreview[] = aiItems.map((raw, idx) => {
      const orig = sliced[idx] ?? sliced[0];
      const confidence = raw.confidence ?? {
        brand: 0, model: 0, version: 0, year_model: 0,
        km: 0, price: 0, source_url: 0, image_url: 0,
      };
      return {
        brand: raw.brand ?? null,
        model: raw.model ?? null,
        version: raw.version ?? null,
        year_model: raw.year_model ?? null,
        km: typeof raw.km === "string" ? Number(raw.km.replace(/[^\d]/g, "")) || null : raw.km,
        price: typeof raw.price === "string" ? Number(raw.price.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")) || null : raw.price,
        source_url: raw.source_url ?? orig?.link ?? null,
        image_url: raw.image_url ?? orig?.image ?? null,
        store_name: raw.store_name ?? null,
        city: raw.city ?? null,
        source: raw.source ?? orig?.source ?? "HTML",
        confidence,
        confidenceAvg: 0,
        status: "review",
        observations: [],
      };
    });

    return {
      items: normalized,
      aiUsed: true,
      aiModel: stats.model,
      aiTokens: stats.tokens,
      aiDurationMs: stats.durationMs,
      errors: [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha na IA";
    return {
      items: [],
      aiUsed: false,
      aiModel: AI_MODEL,
      aiTokens: 0,
      aiDurationMs: 0,
      errors: [msg],
    };
  }
}
