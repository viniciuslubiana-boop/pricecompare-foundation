// HTML Score — algoritmo determinístico, sem dependência de seletores fixos.
// Conta sinais que tipicamente aparecem em páginas de estoque automotivo.

import type { HtmlScoreBreakdown } from "../types";

const PRICE_REGEX = /R\$\s?\d{1,3}(?:\.\d{3})+(?:,\d{2})?|R\$\s?\d{4,}/gi;
const YEAR_REGEX = /\b(19[89]\d|20[0-3]\d)(?:\s*\/\s*(19[89]\d|20[0-3]\d))?\b/g;
const MILEAGE_REGEX = /\b\d{1,3}(?:\.\d{3})+\s*km\b|\b\d{2,6}\s*km\b/gi;

// Marcas comuns no mercado BR (apenas heurística — não normalização).
const BRAND_TOKENS = [
  "fiat", "volkswagen", "vw", "chevrolet", "gm", "ford", "toyota", "honda",
  "hyundai", "renault", "nissan", "jeep", "peugeot", "citroen", "citroën",
  "kia", "mitsubishi", "bmw", "mercedes", "audi", "land rover", "volvo",
  "yamaha", "suzuki", "kawasaki", "harley", "haojue",
];

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

function countCaseInsensitiveTokens(haystack: string, tokens: readonly string[]): number {
  let total = 0;
  const lower = haystack.toLowerCase();
  for (const t of tokens) {
    let from = 0;
    while (true) {
      const idx = lower.indexOf(t, from);
      if (idx === -1) break;
      total += 1;
      from = idx + t.length;
    }
  }
  return total;
}

function countCardLikeContainers(html: string): number {
  // Classes/atributos heurísticos comuns em listas de cards.
  const re = /class\s*=\s*"[^"]*\b(card|veiculo|vehicle|product|item|list-item|tile)\b[^"]*"/gi;
  return countMatches(html, re);
}

function countStructuredData(html: string): number {
  const ldJson = countMatches(html, /<script[^>]+type=["']application\/ld\+json["']/gi);
  const itemtype = countMatches(html, /itemtype\s*=\s*"[^"]*schema\.org\/(Vehicle|Car|Product|Offer)[^"]*"/gi);
  const ogVehicle = countMatches(html, /property\s*=\s*"product:|og:image/gi);
  return ldJson * 3 + itemtype * 3 + Math.min(ogVehicle, 5);
}

function countImageTags(html: string): number {
  return countMatches(html, /<img\b[^>]*>/gi);
}

function countAnchorTags(html: string): number {
  return countMatches(html, /<a\b[^>]+href=/gi);
}

/**
 * Estima a quantidade de veículos representados na página.
 * Usa o menor entre containers-card, preços e anos como aproximação conservadora.
 */
export function estimateVehiclesFromBreakdown(b: HtmlScoreBreakdown): number {
  const signals = [b.cardLikeContainers, b.priceHits, b.yearHits].filter((n) => n > 0);
  if (signals.length === 0) return 0;
  return Math.min(...signals);
}

export function scoreHtml(html: string): HtmlScoreBreakdown {
  if (!html || html.length < 200) {
    return {
      vehicleHits: 0, priceHits: 0, imageHits: 0, linkHits: 0,
      yearHits: 0, mileageHits: 0, cardLikeContainers: 0, structuredData: 0,
      score: 0,
    };
  }

  const vehicleHits = countCaseInsensitiveTokens(html, BRAND_TOKENS);
  const priceHits = countMatches(html, PRICE_REGEX);
  const yearHits = countMatches(html, YEAR_REGEX);
  const mileageHits = countMatches(html, MILEAGE_REGEX);
  const imageHits = countImageTags(html);
  const linkHits = countAnchorTags(html);
  const cardLikeContainers = countCardLikeContainers(html);
  const structuredData = countStructuredData(html);

  // Pesos calibrados para favorecer páginas com várias cards + preços + anos.
  // Cada sinal é limitado para evitar dominância de um único critério.
  const cap = (n: number, max: number) => Math.min(n, max);

  const raw =
    cap(cardLikeContainers, 60) * 1.4 +
    cap(priceHits, 60) * 1.2 +
    cap(yearHits, 60) * 0.7 +
    cap(mileageHits, 60) * 0.7 +
    cap(vehicleHits, 80) * 0.4 +
    cap(imageHits, 80) * 0.2 +
    cap(linkHits, 200) * 0.05 +
    cap(structuredData, 30) * 1.0;

  // Normaliza para 0–100 (raw máximo teórico ≈ 280).
  const score = Math.max(0, Math.min(100, Math.round((raw / 280) * 100)));

  return {
    vehicleHits, priceHits, imageHits, linkHits,
    yearHits, mileageHits, cardLikeContainers, structuredData,
    score,
  };
}
