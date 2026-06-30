// HIE — Technical Preview Engine (Mini-Sprint 4B)
// Server-only. Tenta HTML simples primeiro; se rendimento for baixo,
// chama Firecrawl com actions (scroll + click "Carregar mais").

import {
  detectEmbeddedJson,
  detectInfiniteScroll,
  detectLoadMore,
  detectPagination,
  detectStructuredData,
  detectVehicleCards,
} from "../detectors";
import { assertSafeUrl } from "./html-intelligence.engine";
import type { RawVehicleItem, TechnicalPreview } from "../types";

const FETCH_TIMEOUT_MS = 12_000;
const MIN_RAW_ITEMS_FOR_SKIP_ACTIONS = 6;
const MAX_SCROLL_CYCLES = 3;
const MAX_LOAD_MORE_CLICKS = 3;
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

async function fetchSimpleHtml(url: string): Promise<{ html: string; status: number | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PCM-HtmlIntelligence/1.0",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const html = await res.text();
    return { html, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

interface FirecrawlScrapeResult {
  html: string;
  actionsUsed: boolean;
  scrollCycles: number;
  loadMoreClicks: number;
}

async function firecrawlScrapeWithActions(
  url: string,
  hasLoadMore: boolean,
): Promise<FirecrawlScrapeResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  const actions: Array<Record<string, unknown>> = [];
  // 3 ciclos de scroll
  for (let i = 0; i < MAX_SCROLL_CYCLES; i++) {
    actions.push({ type: "scroll", direction: "down" });
    actions.push({ type: "wait", milliseconds: 1500 });
  }
  // até 3 cliques em "Carregar mais"
  if (hasLoadMore) {
    for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i++) {
      actions.push({
        type: "click",
        selector:
          "button:has-text('Carregar mais'), button:has-text('Ver mais'), button:has-text('Mostrar mais'), a:has-text('Carregar mais'), a:has-text('Ver mais')",
      });
      actions.push({ type: "wait", milliseconds: 1500 });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        url,
        formats: ["rawHtml", "html"],
        onlyMainContent: false,
        waitFor: 1500,
        actions,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { rawHtml?: string; html?: string };
      rawHtml?: string;
      html?: string;
    };
    const html =
      json.data?.rawHtml ?? json.data?.html ?? json.rawHtml ?? json.html ?? "";
    if (!html) return null;
    return {
      html,
      actionsUsed: true,
      scrollCycles: MAX_SCROLL_CYCLES,
      loadMoreClicks: hasLoadMore ? MAX_LOAD_MORE_CLICKS : 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function runDetectors(html: string, url: string) {
  const structured = detectStructuredData(html, url);
  const embedded = detectEmbeddedJson(html, url);
  const htmlItems = detectVehicleCards(html, url);
  const pagination = detectPagination(html, url);
  const loadMore = detectLoadMore(html);
  const scroll = detectInfiniteScroll(html);

  // Prioriza JSON sobre HTML quando JSON tem mais itens
  const jsonItems = embedded.items;
  const merged: RawVehicleItem[] = [];
  const seen = new Set<string>();
  const push = (i: RawVehicleItem) => {
    const k = `${i.link ?? i.title ?? ""}|${i.price ?? ""}`;
    if (seen.has(k)) return;
    seen.add(k);
    merged.push(i);
  };
  for (const i of structured.items) push(i);
  for (const i of jsonItems) push(i);
  for (const i of htmlItems) push(i);

  return {
    structured,
    embedded,
    htmlItems,
    pagination,
    loadMore,
    scroll,
    merged,
  };
}

export async function runTechnicalPreview(rawUrl: string): Promise<TechnicalPreview> {
  const startedAt = Date.now();
  const safe = assertSafeUrl(rawUrl);
  const url = safe.toString();

  // 1) HTML simples
  const simple = await fetchSimpleHtml(url);
  let d = runDetectors(simple.html, url);
  const rawBefore = d.merged.length;

  let actionsUsed = false;
  let scrollCycles = 0;
  let loadMoreClicks = 0;

  // 2) Se rendimento baixo e há sinais de scroll/load more → Firecrawl actions
  const needsActions =
    rawBefore < MIN_RAW_ITEMS_FOR_SKIP_ACTIONS &&
    (d.loadMore.detected || d.scroll.detected);

  if (needsActions) {
    const fc = await firecrawlScrapeWithActions(url, d.loadMore.detected);
    if (fc && fc.html) {
      const d2 = runDetectors(fc.html, url);
      if (d2.merged.length > d.merged.length) {
        d = d2;
        actionsUsed = fc.actionsUsed;
        scrollCycles = fc.scrollCycles;
        loadMoreClicks = fc.loadMoreClicks;
      }
    }
  }

  const rawAfter = d.merged.length;

  return {
    routeUrl: url,
    cardsDetected: d.merged.length,
    jsonItems: d.embedded.items.length,
    htmlItems: d.htmlItems.length,
    structuredItems: d.structured.items.length,
    actionsUsed,
    scrollCycles,
    loadMoreClicks,
    pagination: d.pagination,
    loadMore: d.loadMore,
    scroll: d.scroll,
    embeddedJsonSources: d.embedded.sources,
    structuredDataDetected: d.structured.detected,
    processingMs: Date.now() - startedAt,
    preview: d.merged.slice(0, 20),
    rawBefore,
    rawAfter,
  };
}
