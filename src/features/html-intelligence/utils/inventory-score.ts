// Sprint 011 — Inventory Score
// Score específico para identificar páginas REAIS de estoque, não home institucional.
// Funções puras, sem I/O.

export interface InventoryScoreBreakdown {
  /** 0-100 */
  score: number;
  realCardSignals: number;
  vehicleLinkHits: number;
  inventoryTermHits: number;
  institutionalNoise: number;
  repeatedStructure: number;
  pathBonus: number;
  homePenalty: number;
  priorityBoost: boolean;
  reasons: string[];
}

const INVENTORY_PATHS_RE = /\/(estoque|veiculos|veículos|seminovos|usados|motos|carros|comprar|ofertas|inventory|listagem)(\/|$|\?|#)/i;
const INSTITUTIONAL_RE =
  /\b(banner|hero|slider|swiper|owl-carousel|carousel|institucional|sobre[-_ ]?nos|fale[-_ ]?conosco|financiamento[-_ ]?facil|servicos|atendimento[-_ ]?personalizado|nossa[-_ ]?historia|trabalhe[-_ ]?conosco|home[-_ ]?banner)\b/gi;
const INVENTORY_TERM_RE =
  /\b(estoque|seminovo[s]?|usado[s]?|nosso[s]?\s+ve[ií]culos|nossa\s+frota|motos\s+dispon[íi]veis|carros\s+dispon[íi]veis|ve[ií]culos\s+dispon[íi]veis)\b/gi;
const VEHICLE_LINK_RE =
  /href\s*=\s*["'][^"']*\/(veiculo|veículo|anuncio|anúncio|carro|moto|seminovo|usado|estoque|oferta|detalhe|comprar)\/[^"']*["']/gi;
const CARD_CONTAINER_RE =
  /class\s*=\s*"[^"]*\b(card|veiculo|vehicle|product|item|list-item|tile|anuncio|vitrine|produto|oferta)\b[^"]*"/gi;
const PRICE_RE = /R\$\s?\d{1,3}(?:\.\d{3})+(?:,\d{2})?|R\$\s?\d{4,}/gi;
const YEAR_RE = /\b(19[89]\d|20[0-3]\d)\b/g;
const KM_RE = /\b\d{1,3}(?:\.\d{3})+\s*km\b|\b\d{2,6}\s*km\b/gi;

function count(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

export interface ScoreInventoryInput {
  html: string;
  path: string;
  /** URL informada explicitamente pelo usuário (recebe prioridade). */
  isUserProvided?: boolean;
}

export function scoreInventory(input: ScoreInventoryInput): InventoryScoreBreakdown {
  const { html, path } = input;
  const reasons: string[] = [];

  if (!html || html.length < 200) {
    return {
      score: 0, realCardSignals: 0, vehicleLinkHits: 0, inventoryTermHits: 0,
      institutionalNoise: 0, repeatedStructure: 0, pathBonus: 0, homePenalty: 0,
      priorityBoost: !!input.isUserProvided, reasons: ["HTML vazio/curto"],
    };
  }

  const priceHits = count(html, PRICE_RE);
  const yearHits = count(html, YEAR_RE);
  const kmHits = count(html, KM_RE);
  const cardContainers = count(html, CARD_CONTAINER_RE);
  const vehicleLinkHits = count(html, VEHICLE_LINK_RE);
  const inventoryTermHits = count(html, INVENTORY_TERM_RE);
  const institutionalNoise = count(html, INSTITUTIONAL_RE);

  // sinais "reais" = menor entre cards/preços/anos (similar a estimateVehicles, mas exige >=3)
  const signals = [cardContainers, priceHits, yearHits].filter((n) => n > 0);
  const realCardSignals = signals.length === 0 ? 0 : Math.min(...signals);

  // repetição de estrutura: muitos cards + muitas <li>/<article> próximos
  const liCount = count(html, /<li\b/gi);
  const articleCount = count(html, /<article\b/gi);
  const repeatedStructure = Math.min(cardContainers, Math.max(liCount, articleCount, 0));

  // path bonus
  const isInventoryPath = INVENTORY_PATHS_RE.test(path);
  const isHome = path === "/" || path === "";
  let pathBonus = 0;
  if (isInventoryPath && realCardSignals >= 3) {
    pathBonus = 25;
    reasons.push(`bônus por rota de estoque (${path})`);
  } else if (isInventoryPath && realCardSignals < 3) {
    pathBonus = 5;
    reasons.push(`rota de estoque sem sinais suficientes`);
  }

  let homePenalty = 0;
  if (isHome && realCardSignals < 8) {
    homePenalty = 20;
    reasons.push(`penalidade home/ sem volume real de estoque`);
  }

  if (input.isUserProvided) {
    reasons.push("URL informada pelo usuário (prioridade)");
  }

  // ── Cálculo bruto ───────────────────────────────────────────
  const cap = (n: number, m: number) => Math.min(n, m);
  const raw =
    cap(realCardSignals, 50) * 2.2 +
    cap(vehicleLinkHits, 50) * 1.6 +
    cap(priceHits, 60) * 0.6 +
    cap(yearHits, 60) * 0.4 +
    cap(kmHits, 60) * 0.4 +
    cap(repeatedStructure, 30) * 0.8 +
    cap(inventoryTermHits, 20) * 1.2 -
    cap(institutionalNoise, 20) * 1.5 +
    pathBonus -
    homePenalty;

  const score = Math.max(0, Math.min(100, Math.round((raw / 220) * 100)));

  if (vehicleLinkHits >= 5) reasons.push(`${vehicleLinkHits} links para anúncios individuais`);
  if (institutionalNoise >= 5) reasons.push(`${institutionalNoise} sinais institucionais`);
  if (realCardSignals >= 6) reasons.push(`${realCardSignals} cards reais de veículos`);

  return {
    score,
    realCardSignals,
    vehicleLinkHits,
    inventoryTermHits,
    institutionalNoise,
    repeatedStructure,
    pathBonus,
    homePenalty,
    priorityBoost: !!input.isUserProvided,
    reasons,
  };
}
