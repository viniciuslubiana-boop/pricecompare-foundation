// Sprint 011 — Extractor Quality Score
// Mede a qualidade dos itens brutos (RawVehicleItem) por campo.
// Explica por que muitos brutos podem virar 0 aprovados na IA.

import type { RawVehicleItem } from "../types";

export interface ExtractorQualityScore {
  total: number;
  pctPrice: number;
  pctYear: number;
  pctKm: number;
  pctTitle: number;
  pctLink: number;
  pctImage: number;
  /** 0-100 — média ponderada de cobertura por campo. */
  qualityScore: number;
  missingFields: string[];
  recommendations: string[];
}

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

export function computeExtractorQuality(items: RawVehicleItem[]): ExtractorQualityScore {
  const total = items.length;
  if (total === 0) {
    return {
      total: 0, pctPrice: 0, pctYear: 0, pctKm: 0,
      pctTitle: 0, pctLink: 0, pctImage: 0,
      qualityScore: 0, missingFields: ["sem itens"], recommendations: [],
    };
  }

  let p = 0, y = 0, k = 0, t = 0, l = 0, img = 0;
  for (const it of items) {
    if (it.price) p++;
    if (it.year) y++;
    if (it.km) k++;
    if (it.title && it.title.trim().length > 3) t++;
    if (it.link) l++;
    if (it.image) img++;
  }

  const pctPrice = pct(p, total);
  const pctYear = pct(y, total);
  const pctKm = pct(k, total);
  const pctTitle = pct(t, total);
  const pctLink = pct(l, total);
  const pctImage = pct(img, total);

  // Peso: preço e título são críticos; ano/km importantes; link/imagem desejáveis.
  const qualityScore = Math.round(
    pctPrice * 0.30 +
    pctTitle * 0.25 +
    pctYear  * 0.15 +
    pctKm    * 0.10 +
    pctLink  * 0.10 +
    pctImage * 0.10,
  );

  const missingFields: string[] = [];
  if (pctPrice < 70) missingFields.push(`preço ausente em ${100 - pctPrice}% dos cards`);
  if (pctTitle < 70) missingFields.push(`título fraco em ${100 - pctTitle}% dos cards`);
  if (pctYear < 50) missingFields.push(`ano ausente em ${100 - pctYear}% dos cards`);
  if (pctKm < 40) missingFields.push(`KM ausente em ${100 - pctKm}% dos cards`);
  if (pctLink < 50) missingFields.push(`link ausente em ${100 - pctLink}% dos cards`);

  const recommendations: string[] = [];
  if (pctPrice < 50) recommendations.push("Site provavelmente carrega preços via JS — testar renderização (Firecrawl actions).");
  if (pctTitle < 50) recommendations.push("Títulos não estão em <h*>/aria-label — revisar VehicleCardDetector.");
  if (pctLink < 50) recommendations.push("Cards sem <a href>: site pode ser SPA com onClick — checar JSON embarcado.");
  if (qualityScore < 40) recommendations.push("Qualidade insuficiente — IA tende a rejeitar todos os itens.");

  return {
    total, pctPrice, pctYear, pctKm, pctTitle, pctLink, pctImage,
    qualityScore, missingFields, recommendations,
  };
}
