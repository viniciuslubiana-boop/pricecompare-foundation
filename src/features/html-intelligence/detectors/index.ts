// HTML Intelligence Engine — Detectores (Mini-Sprint 4B)
// Heurísticos puros, sem IA, sem normalização, sem persistência.
// Recebem HTML bruto + URL base e devolvem itens em memória.

import type {
  PaginationInfo,
  LoadMoreInfo,
  ScrollInfo,
  EmbeddedJsonResult,
  StructuredDataResult,
  RawVehicleItem,
  RawItemSource,
} from "../types";

const PRICE_RE = /R\$\s?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{4,})/i;
const YEAR_RE = /\b(19[89]\d|20[0-3]\d)(?:\s*\/\s*(19[89]\d|20[0-3]\d))?\b/;
const KM_RE = /\b(\d{1,3}(?:\.\d{3})+|\d{2,6})\s*km\b/i;

function absolutize(href: string | null, baseUrl: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// ─────────────────────────────────────────────────────────────
// Structured Data Detector (JSON-LD / Schema.org)
// ─────────────────────────────────────────────────────────────
export function detectStructuredData(
  html: string,
  baseUrl: string,
): StructuredDataResult {
  const items: RawVehicleItem[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(unescapeHtml(raw));
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        collectFromLdNode(node, items, baseUrl);
      }
    } catch {
      // ignore JSON inválido
    }
  }
  return { detected: items.length > 0 || /itemtype=["'][^"']*schema\.org\/(Vehicle|Car|Product)/.test(html), items };
}

function collectFromLdNode(node: unknown, out: RawVehicleItem[], baseUrl: string): void {
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const graph = obj["@graph"];
  if (Array.isArray(graph)) {
    for (const g of graph) collectFromLdNode(g, out, baseUrl);
  }
  const type = obj["@type"];
  const typeStr = Array.isArray(type) ? type.join(",") : typeof type === "string" ? type : "";
  if (/Vehicle|Car|Product|Offer/i.test(typeStr)) {
    const item = ldNodeToItem(obj, baseUrl);
    if (item) out.push(item);
  }
  // Recursão rasa em itemListElement
  const list = obj["itemListElement"];
  if (Array.isArray(list)) {
    for (const el of list) {
      const item = (el as Record<string, unknown>)?.item ?? el;
      collectFromLdNode(item, out, baseUrl);
    }
  }
}

function ldNodeToItem(obj: Record<string, unknown>, baseUrl: string): RawVehicleItem | null {
  const title = (obj.name as string) ?? (obj.headline as string) ?? null;
  let price: string | null = null;
  const offers = obj.offers as Record<string, unknown> | undefined;
  if (offers) {
    const p = offers.price ?? offers.lowPrice;
    if (p != null) price = String(p);
  }
  if (!price && obj.price != null) price = String(obj.price);
  const year =
    (obj.modelDate as string) ??
    (obj.productionDate as string) ??
    (obj.releaseDate as string) ??
    null;
  const km =
    (obj.mileageFromOdometer as { value?: unknown })?.value != null
      ? String((obj.mileageFromOdometer as { value: unknown }).value)
      : null;
  const url = absolutize((obj.url as string) ?? null, baseUrl);
  const image = Array.isArray(obj.image)
    ? absolutize(String(obj.image[0]), baseUrl)
    : typeof obj.image === "string"
      ? absolutize(obj.image, baseUrl)
      : null;
  if (!title && !price && !url) return null;
  return {
    title: title?.toString().trim() ?? null,
    price,
    year: year ? String(year) : null,
    km,
    link: url,
    image,
    rawText: JSON.stringify(obj).slice(0, 400),
    source: "STRUCTURED_DATA",
    sourcePage: baseUrl,
    confidence: 90,
  };
}

// ─────────────────────────────────────────────────────────────
// Embedded JSON Detector (__NEXT_DATA__, __INITIAL_STATE__, etc.)
// ─────────────────────────────────────────────────────────────
const EMBEDDED_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "__NEXT_DATA__", re: /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i },
  { name: "__NUXT__", re: /<script[^>]*>\s*window\.__NUXT__\s*=\s*([\s\S]*?);?\s*<\/script>/i },
  { name: "__INITIAL_STATE__", re: /window\.__INITIAL_STATE__\s*=\s*([\s\S]*?);[\s\n]*<\/script>/i },
  { name: "__APOLLO_STATE__", re: /window\.__APOLLO_STATE__\s*=\s*([\s\S]*?);[\s\n]*<\/script>/i },
  { name: "__REDUX_STATE__", re: /window\.__REDUX_STATE__\s*=\s*([\s\S]*?);[\s\n]*<\/script>/i },
];

export function detectEmbeddedJson(
  html: string,
  baseUrl: string,
): EmbeddedJsonResult {
  const sources: string[] = [];
  const items: RawVehicleItem[] = [];

  for (const p of EMBEDDED_PATTERNS) {
    const m = p.re.exec(html);
    if (!m) continue;
    try {
      const parsed = JSON.parse(unescapeHtml(m[1].trim()));
      sources.push(p.name);
      walkForVehicles(parsed, items, baseUrl, 0);
    } catch {
      sources.push(`${p.name}(parse_error)`);
    }
  }

  // application/json genérico
  const re = /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(unescapeHtml(m[1].trim()));
      const before = items.length;
      walkForVehicles(parsed, items, baseUrl, 0);
      if (items.length > before) sources.push("application/json");
    } catch {
      // ignore
    }
  }

  // dedup por link/title
  const seen = new Set<string>();
  const deduped = items.filter((i) => {
    const k = `${i.link ?? ""}|${i.title ?? ""}|${i.price ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { detected: sources.length > 0, sources, items: deduped };
}

const VEHICLE_KEYS = ["brand", "marca", "modelo", "model", "make", "version", "versao", "versão"];
const PRICE_KEYS = ["price", "preco", "preço", "valor", "amount"];
const YEAR_KEYS = ["year", "ano", "modelYear", "anoModelo"];
const KM_KEYS = ["km", "mileage", "quilometragem", "odometer"];
const TITLE_KEYS = ["title", "titulo", "name", "nome", "descricao"];
const URL_KEYS = ["url", "href", "link", "permalink", "slug"];
const IMAGE_KEYS = ["image", "imagem", "foto", "thumbnail", "thumb", "photo"];

function pickFirst(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
    const lk = Object.keys(obj).find((x) => x.toLowerCase() === k.toLowerCase());
    if (lk && obj[lk] != null) return obj[lk];
  }
  return null;
}

function walkForVehicles(
  node: unknown,
  out: RawVehicleItem[],
  baseUrl: string,
  depth: number,
): void {
  if (depth > 8 || out.length > 200) return;
  if (Array.isArray(node)) {
    for (const v of node) walkForVehicles(v, out, baseUrl, depth + 1);
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  // Heurística: tem algo que parece veículo + preço/ano?
  const hasVehicleKey = VEHICLE_KEYS.some((k) => obj[k] != null);
  const hasPrice = PRICE_KEYS.some((k) => obj[k] != null);
  const hasYear = YEAR_KEYS.some((k) => obj[k] != null);
  if (hasVehicleKey && (hasPrice || hasYear)) {
    const title = pickFirst(obj, TITLE_KEYS);
    const brand = pickFirst(obj, ["brand", "marca", "make"]);
    const model = pickFirst(obj, ["model", "modelo"]);
    const version = pickFirst(obj, ["version", "versao", "versão"]);
    const computedTitle =
      title?.toString() ??
      [brand, model, version].filter(Boolean).map(String).join(" ").trim() ??
      null;
    const price = pickFirst(obj, PRICE_KEYS);
    const year = pickFirst(obj, YEAR_KEYS);
    const km = pickFirst(obj, KM_KEYS);
    const url = pickFirst(obj, URL_KEYS);
    const img = pickFirst(obj, IMAGE_KEYS);
    out.push({
      title: computedTitle || null,
      price: price != null ? String(price) : null,
      year: year != null ? String(year) : null,
      km: km != null ? String(km) : null,
      link: absolutize(url != null ? String(url) : null, baseUrl),
      image: absolutize(img != null ? String(img) : null, baseUrl),
      rawText: JSON.stringify(obj).slice(0, 400),
      source: "JSON",
      sourcePage: baseUrl,
      confidence: 80,
    });
    return; // não desce dentro de um veículo já capturado
  }
  for (const v of Object.values(obj)) walkForVehicles(v, out, baseUrl, depth + 1);
}

// ─────────────────────────────────────────────────────────────
// Vehicle Card Detector (HTML)
// ─────────────────────────────────────────────────────────────
const CARD_RE =
  /<(?:article|li|div)\b[^>]*class\s*=\s*"[^"]*\b(?:card|veiculo|vehicle|product|item|list-item|tile|anuncio|vitrine)\b[^"]*"[^>]*>([\s\S]*?)<\/(?:article|li|div)>/gi;

export function detectVehicleCards(html: string, baseUrl: string): RawVehicleItem[] {
  const out: RawVehicleItem[] = [];
  let m: RegExpExecArray | null;
  let safety = 0;
  while ((m = CARD_RE.exec(html)) !== null && safety++ < 500) {
    const inner = m[1];
    const text = stripTags(inner);
    const priceMatch = text.match(PRICE_RE);
    const yearMatch = text.match(YEAR_RE);
    const kmMatch = text.match(KM_RE);
    if (!priceMatch && !yearMatch) continue;
    const linkMatch = inner.match(/<a\b[^>]+href=["']([^"']+)["']/i);
    const imgMatch = inner.match(/<img\b[^>]+src=["']([^"']+)["']/i);
    const titleMatch =
      inner.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] ??
      inner.match(/title=["']([^"']+)["']/i)?.[1] ??
      text.slice(0, 80);
    out.push({
      title: stripTags(String(titleMatch)).slice(0, 160) || null,
      price: priceMatch ? priceMatch[0] : null,
      year: yearMatch ? yearMatch[0] : null,
      km: kmMatch ? kmMatch[0] : null,
      link: absolutize(linkMatch?.[1] ?? null, baseUrl),
      image: absolutize(imgMatch?.[1] ?? null, baseUrl),
      rawText: text.slice(0, 400),
      source: "HTML",
      sourcePage: baseUrl,
      confidence:
        (priceMatch ? 35 : 0) + (yearMatch ? 25 : 0) + (kmMatch ? 15 : 0) + (linkMatch ? 15 : 0),
    });
  }
  // dedup por link+price
  const seen = new Set<string>();
  return out.filter((i) => {
    const k = `${i.link ?? i.title ?? ""}|${i.price ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Pagination Detector
// ─────────────────────────────────────────────────────────────
export function detectPagination(html: string, baseUrl: string): PaginationInfo {
  const hrefRe =
    /<a\b[^>]+href=["']([^"']*(?:\?|&|\/)(?:page|pagina|p|offset|cursor)=?[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    const abs = absolutize(m[1], baseUrl);
    if (abs && !candidates.includes(abs)) candidates.push(abs);
  }
  const nextRe =
    /<a\b[^>]+href=["']([^"']+)["'][^>]*>\s*(?:pr[óo]xim[ao]|next|seguinte|&raquo;|»)\s*<\/a>/i;
  const next = nextRe.exec(html);
  const nextUrl = next ? absolutize(next[1], baseUrl) : candidates[0] ?? null;
  return {
    detected: candidates.length > 0 || !!nextUrl,
    nextPageUrl: nextUrl,
    candidates: candidates.slice(0, 10),
  };
}

// ─────────────────────────────────────────────────────────────
// Load More Detector
// ─────────────────────────────────────────────────────────────
export function detectLoadMore(html: string): LoadMoreInfo {
  const re =
    /<(?:button|a)\b[^>]*>(?:[\s\S]{0,80}?)(carregar\s+mais|ver\s+mais|mostrar\s+mais|load\s+more|more)(?:[\s\S]{0,80}?)<\/(?:button|a)>/i;
  const m = re.exec(html);
  return {
    detected: !!m,
    label: m ? stripTags(m[0]).slice(0, 60) : null,
  };
}

// ─────────────────────────────────────────────────────────────
// Infinite Scroll Detector (heurístico)
// ─────────────────────────────────────────────────────────────
export function detectInfiniteScroll(html: string): ScrollInfo {
  const hints =
    /(IntersectionObserver|infinite[-_ ]?scroll|loadMoreOnScroll|useInfinite|scroll-loader)/i;
  return { detected: hints.test(html) };
}

export type {
  RawVehicleItem,
  RawItemSource,
  PaginationInfo,
  LoadMoreInfo,
  ScrollInfo,
  EmbeddedJsonResult,
  StructuredDataResult,
};
