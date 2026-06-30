// HIE — candidatos compartilhados de cards de veículos.
// Utilitário puro usado pelo scorer e pelo VehicleCardDetector para evitar
// divergência entre "cards estimados" e "cards extraídos".

import type { RawVehicleItem } from "../types";

const START_TAG_RE = /<(article|li|div|section|a)\b([^>]*)>/gi;
const CARD_TOKEN_RE =
  /\b(card|card-car|card-est|box-carro|box-veiculo|veiculo|veículo|vehicle|product|produto|item|list-item|tile|anuncio|anúncio|vitrine|oferta|estoque|seminovo|usado|resultado|result)\b/i;
const PRICE_RE = /R\$\s?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{4,}(?:,\d{2})?)/i;
const PRICE_ATTR_RE =
  /\b(?:data-price|data-valor|data-preco|data-preço|content|price|valor)\s*=\s*["']?\s*R?\$?\s?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{4,}(?:,\d{2})?)/i;
const PRICE_LABEL_RE =
  /\b(?:pre[cç]o|valor)\s*:?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{5,}(?:,\d{2})?)/i;
const YEAR_RE = /\b(19[89]\d|20[0-3]\d)(?:\s*\/\s*(19[89]\d|20[0-3]\d))?\b/;
const YEAR_LABEL_RE = /\b(?:ano|modelo)\s*:?\s*(19[89]\d|20[0-3]\d)\b/gi;
const KM_RE = /\b(\d{1,3}(?:\.\d{3})+|\d{2,6})\s*(?:km|quil[oô]metros?)\b/i;
const KM_LABEL_RE = /\b(?:km|quilometragem)\s*:?\s*(\d{1,3}(?:\.\d{3})+|\d{2,6})\b/i;
const VEHICLE_LINK_RE =
  /\/(?:carros?|motos?|ve[ií]culos?|vehicle|veiculo|an[uú]ncios?|seminovos?|usados?|ofertas?|detalhes?|comprar)\//i;
const BAD_LINK_RE = /^(#|javascript:|tel:|mailto:)|(?:wa\.me|whatsapp|api\.whatsapp)/i;
const INVALID_TITLE_RE =
  /\b(whatsapp|conversar\s+pelo\s+whatsapp|tenho\s+interesse|ver\s+detalhes|ver\s+mais|saiba\s+mais|financie|simular\s+financiamento|proposta|ligar|favorito|compartilhe|filtrar|ordenar|carregar\s+mais|mostrar\s+mais)\b/i;
const BAD_IMAGE_RE = /(?:\/marcas\/|\/marca\/|logo|favicon|icon-|ano\.svg|km\.svg|whatsapp|placeholder)/i;

export interface VehicleCardCandidate {
  html: string;
  text: string;
  tagName: string;
  attrs: string;
  startIndex: number;
  endIndex: number;
  priceHits: number;
  yearHits: number;
  kmHits: number;
  vehicleLinkHits: number;
  imageHits: number;
  ancestorHref: string | null;
}

export interface VehicleCardInspection {
  candidatesFound: number;
  accepted: number;
  rejected: number;
  rejectionReasons: string[];
  items: RawVehicleItem[];
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function unescapeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripHtmlToText(html: string): string {
  return normalizeSpace(
    unescapeHtml(html)
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function htmlToLines(html: string): string[] {
  return unescapeHtml(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(?:br|\/div|\/p|\/h[1-6]|\/li|\/a|\/span)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map((line) => normalizeSpace(line))
    .filter(Boolean);
}

export function absolutizeUrl(href: string | null, baseUrl: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function countMatches(value: string, re: RegExp): number {
  const m = value.match(re);
  return m ? m.length : 0;
}

function hasCardToken(attrs: string): boolean {
  return CARD_TOKEN_RE.test(unescapeHtml(attrs));
}

function captureBalancedElement(html: string, startIndex: number, tagName: string): string | null {
  const tokenRe = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokenRe.lastIndex = startIndex;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(html)) !== null) {
    const token = m[0];
    if (token.startsWith("</")) {
      depth -= 1;
      if (depth === 0) return html.slice(startIndex, tokenRe.lastIndex);
    } else {
      depth += 1;
    }
    if (tokenRe.lastIndex - startIndex > 40_000) return null;
  }
  return null;
}

function buildCandidate(html: string, startIndex: number, tagName: string, attrs: string): VehicleCardCandidate | null {
  const fragment = captureBalancedElement(html, startIndex, tagName);
  if (!fragment || fragment.length < 80 || fragment.length > 40_000) return null;
  const text = stripHtmlToText(fragment);
  if (text.length < 12) return null;
  const ancestorHref = extractOpenAncestorHref(html, startIndex);
  const vehicleLinkHits = [...extractCandidateUrls(fragment), ancestorHref ?? ""].filter(isVehicleLikeLink).length;
  return {
    html: fragment,
    text,
    tagName,
    attrs,
    startIndex,
    endIndex: startIndex + fragment.length,
    priceHits: countMatches(text, /R\$\s?\d/gi) + (PRICE_ATTR_RE.test(fragment) || PRICE_LABEL_RE.test(text) ? 1 : 0),
    yearHits: countMatches(text, /\b(?:19[89]\d|20[0-3]\d)(?:\s*\/\s*(?:19[89]\d|20[0-3]\d))?\b/g),
    kmHits:
      countMatches(text, /\b(?:\d{1,3}(?:\.\d{3})+|\d{2,6})\s*(?:km|quil[oô]metros?)\b/gi) +
      (KM_LABEL_RE.test(text) ? 1 : 0),
    vehicleLinkHits,
    imageHits: extractImageCandidates(fragment).length,
    ancestorHref,
  };
}

export function discoverVehicleCardCandidates(html: string): VehicleCardCandidate[] {
  if (!html || html.length < 200) return [];
  const candidates: VehicleCardCandidate[] = [];
  const seen = new Set<string>();
  START_TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let safety = 0;
  while ((m = START_TAG_RE.exec(html)) !== null && safety++ < 1_200) {
    const tagName = m[1].toLowerCase();
    const attrs = m[2] ?? "";
    if (!hasCardToken(attrs)) continue;
    const candidate = buildCandidate(html, m.index, tagName, attrs);
    if (!candidate) continue;
    const key = `${candidate.startIndex}:${candidate.endIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(candidate);
    if (candidates.length >= 600) break;
  }
  return candidates;
}

export function isQualifiedVehicleCardCandidate(candidate: VehicleCardCandidate): boolean {
  return (
    (candidate.priceHits > 0 && (candidate.yearHits > 0 || candidate.vehicleLinkHits > 0)) ||
    (candidate.vehicleLinkHits > 0 && candidate.yearHits > 0)
  );
}

export function countQualifiedVehicleCardCandidates(html: string): number {
  return inspectVehicleCardCandidates(html, "https://pcm.local").items.length;
}

function attrPattern(names: string[]): RegExp {
  const joined = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`\\b(?:${joined})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "gi");
}

function getAttributeValues(html: string, names: string[]): string[] {
  const values: string[] = [];
  const re = attrPattern(names);
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const value = m[1] ?? m[2] ?? m[3] ?? "";
    const clean = normalizeSpace(unescapeHtml(value));
    if (clean) values.push(clean);
  }
  return values;
}

function cleanVehicleTitle(value: string): string {
  return normalizeSpace(
    stripHtmlToText(value)
      .replace(/\bver\s+mais\s+detalhes\s+sobre\s+o\s+ve[ií]?culo\b/gi, " ")
      .replace(/\bver\s+mais\s+detalhes\s+sobre\s+o\s+veculo\b/gi, " ")
      .replace(PRICE_RE, " ")
      .replace(/^\s*(?:19[89]\d|20[0-3]\d)(?:\s*\/\s*(?:19[89]\d|20[0-3]\d))?\s+/i, " ")
      .replace(/\b(?:ano|modelo|quilometragem|pre[cç]o)\b\s*:?/gi, " "),
  ).slice(0, 180);
}

export function isInvalidVehicleTitle(value: string | null | undefined): boolean {
  const title = normalizeSpace(value ?? "");
  if (title.length < 4 || title.length > 180) return true;
  if (INVALID_TITLE_RE.test(title)) return true;
  if (/^R\$?\s?[\d.,]+$/i.test(title)) return true;
  if (/^(?:19[89]\d|20[0-3]\d)(?:\s*\/\s*(?:19[89]\d|20[0-3]\d))?$/i.test(title)) return true;
  if (KM_RE.test(title) && title.length < 18) return true;
  if (/^path\s+\d+$/i.test(title)) return true;
  if (/^(ano|km|quilometragem|pre[cç]o|manual|autom[aá]tico|flex|gasolina|diesel)$/i.test(title)) return true;
  const alphaGroups = title.match(/[A-Za-zÀ-ÿ0-9]{2,}/g) ?? [];
  return alphaGroups.length < 2;
}

function firstValidTitle(values: string[]): string | null {
  for (const value of values) {
    const clean = cleanVehicleTitle(value);
    if (!isInvalidVehicleTitle(clean)) return clean;
  }
  return null;
}

function extractHeadingTitles(html: string): string[] {
  const values: string[] = [];
  const re = /<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) values.push(m[1]);
  return values;
}

function extractAnchorTexts(html: string): string[] {
  const values: string[] = [];
  const re = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) values.push(m[1]);
  return values;
}

function slugToTitle(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://pcm.local");
    const last = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    const withoutExt = decodeURIComponent(last).replace(/\.[a-z0-9]+$/i, "");
    const withoutId = withoutExt.replace(/[-_]?\d{5,}$/g, "");
    const clean = cleanVehicleTitle(withoutId.replace(/[-_]+/g, " "));
    return isInvalidVehicleTitle(clean) ? null : clean;
  } catch {
    return null;
  }
}

function extractTitle(candidate: VehicleCardCandidate, linkRaw: string | null): string | null {
  return (
    firstValidTitle(getAttributeValues(candidate.html, ["data-title", "data-name", "data-vehicle-title"])) ??
    firstValidTitle(getAttributeValues(candidate.html, ["aria-label", "title"])) ??
    firstValidTitle(extractHeadingTitles(candidate.html)) ??
    firstValidTitle(getAttributeValues(candidate.html, ["alt", "data-alt"])) ??
    firstValidTitle(extractAnchorTexts(candidate.html)) ??
    slugToTitle(linkRaw) ??
    firstValidTitle(htmlToLines(candidate.html))
  );
}

function extractPrice(candidate: VehicleCardCandidate): string | null {
  const fromText = candidate.text.match(PRICE_RE);
  if (fromText) return fromText[0];
  const fromLabel = candidate.text.match(PRICE_LABEL_RE);
  if (fromLabel) return `R$ ${fromLabel[1]}`;
  const fromAttr = candidate.html.match(PRICE_ATTR_RE);
  return fromAttr ? `R$ ${fromAttr[1]}` : null;
}

function extractYear(text: string): string | null {
  const pair = text.match(YEAR_RE);
  if (pair?.[0]) return pair[0];
  const labelled = [...text.matchAll(YEAR_LABEL_RE)].map((match) => match[1]);
  if (labelled.length >= 2) return `${labelled[0]}/${labelled[labelled.length - 1]}`;
  return labelled[0] ?? null;
}

function extractKm(text: string): string | null {
  const direct = text.match(KM_RE);
  if (direct?.[0]) return direct[0];
  const labelled = text.match(KM_LABEL_RE);
  return labelled ? `${labelled[1]} km` : null;
}

function isVehicleLikeLink(url: string): boolean {
  if (BAD_LINK_RE.test(url)) return false;
  return VEHICLE_LINK_RE.test(url) || /\.(?:html?|php)(?:$|[?#])/i.test(url);
}

function extractCandidateUrls(html: string): string[] {
  const values = getAttributeValues(html, ["href", "data-href", "data-url", "data-link", "to", "router-link", "ng-href"]);
  const onclickRe = /\b(?:onclick|data-click)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m: RegExpExecArray | null;
  while ((m = onclickRe.exec(html)) !== null) {
    const code = m[1] ?? m[2] ?? "";
    const url = code.match(/(?:location\.href|window\.location|window\.open)\s*(?:=|\()\s*['"]([^'"]+)['"]/i)?.[1];
    if (url) values.push(url);
  }
  for (const slug of getAttributeValues(html, ["data-slug", "slug"])) {
    values.push(slug);
  }
  return values.filter((value, index, arr) => value && arr.indexOf(value) === index);
}

function extractOpenAncestorHref(html: string, startIndex: number): string | null {
  const before = html.slice(Math.max(0, startIndex - 20_000), startIndex);
  const lastOpen = before.lastIndexOf("<a");
  if (lastOpen === -1) return null;
  const lastClose = before.lastIndexOf("</a>");
  if (lastClose > lastOpen) return null;
  const tag = before.slice(lastOpen).match(/^<a\b[^>]*>/i)?.[0] ?? "";
  return getAttributeValues(tag, ["href", "data-href", "data-url", "to", "router-link"])[0] ?? null;
}

function extractLink(candidate: VehicleCardCandidate): string | null {
  const urls = [candidate.ancestorHref, ...extractCandidateUrls(candidate.html)].filter(
    (url): url is string => !!url && !BAD_LINK_RE.test(url),
  );
  return urls.find(isVehicleLikeLink) ?? urls[0] ?? null;
}

function normalizeSrcsetValue(value: string): string {
  return normalizeSpace(value.split(",")[0]?.trim().split(/\s+/)[0] ?? "");
}

function extractImageCandidates(html: string): string[] {
  const values = [
    ...getAttributeValues(html, ["data-src", "data-original", "data-lazy", "data-img", "data-image", "src"]),
    ...getAttributeValues(html, ["srcset", "data-srcset"]).map(normalizeSrcsetValue),
  ];
  const bgRe = /background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi;
  let m: RegExpExecArray | null;
  while ((m = bgRe.exec(html)) !== null) values.push(m[2]);
  return values
    .map((value) => normalizeSpace(value))
    .filter((value, index, arr) => value && !/^data:/i.test(value) && !BAD_IMAGE_RE.test(value) && arr.indexOf(value) === index);
}

function extractImage(candidate: VehicleCardCandidate): string | null {
  return extractImageCandidates(candidate.html)[0] ?? null;
}

function rejectionSummary(reasons: string[]): string[] {
  const counts = new Map<string, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts.entries()].map(([reason, count]) => `${reason}: ${count}`);
}

export function inspectVehicleCardCandidates(html: string, baseUrl: string): VehicleCardInspection {
  const candidates = discoverVehicleCardCandidates(html);
  const items: RawVehicleItem[] = [];
  const rejectedReasons: string[] = [];

  for (const candidate of candidates) {
    const priceRaw = extractPrice(candidate);
    const year = extractYear(candidate.text);
    const km = extractKm(candidate.text);
    const linkRaw = extractLink(candidate);
    const imageRaw = extractImage(candidate);
    const title = extractTitle(candidate, linkRaw);

    if (!priceRaw && !year && !linkRaw) {
      rejectedReasons.push("sem preço, ano ou link de veículo");
      continue;
    }
    if (isInvalidVehicleTitle(title)) {
      rejectedReasons.push("título ausente ou inválido");
      continue;
    }
    if (!priceRaw && !linkRaw) {
      rejectedReasons.push("sem preço ou link de veículo");
      continue;
    }
    if (!priceRaw && !year) {
      rejectedReasons.push("sem preço ou ano no card");
      continue;
    }

    items.push({
      title,
      price: priceRaw,
      year,
      km,
      link: absolutizeUrl(linkRaw, baseUrl),
      image: absolutizeUrl(imageRaw, baseUrl),
      rawText: candidate.text.slice(0, 500),
      source: "HTML",
      sourcePage: baseUrl,
      confidence: Math.min(
        100,
        (title ? 15 : 0) +
          (priceRaw ? 35 : 0) +
          (year ? 20 : 0) +
          (km ? 15 : 0) +
          (linkRaw ? 15 : 0) +
          (imageRaw ? 10 : 0),
      ),
    });
  }

  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    const key = `${item.link ?? item.title ?? ""}|${item.price ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    candidatesFound: candidates.length,
    accepted: deduped.length,
    rejected: candidates.length - deduped.length,
    rejectionReasons: rejectionSummary(rejectedReasons),
    items: deduped,
  };
}

export function extractVehicleCardItems(html: string, baseUrl: string): RawVehicleItem[] {
  return inspectVehicleCardCandidates(html, baseUrl).items;
}