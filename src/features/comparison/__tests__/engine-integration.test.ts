/**
 * Integração — Comparison Engine como gatekeeper único.
 *
 * Valida que Radar, Estratégia, Consulta Global (filtro de pool) e
 * Comparações (matcher) exibem APENAS veículos aprovados pela
 * equivalência estrita (`isEquivalent`).
 */
import { describe, expect, it } from "vitest";
import {
  equivalentsFor,
  intelligenceFor,
} from "../calculators/comparison.market-price";
import { priorityFor, radarActionFor } from "../calculators/radar";
import { strategyFor } from "../calculators/comparison.strategy";
import { matchInventoryAgainstCompetitor } from "../matching/comparison.matcher";
import {
  isEquivalent,
  modelCompactOf,
} from "../matching/vehicle-equivalence";
import type { CompetitorVehicle, MyVehicle } from "@/types/database.types";

const me = (over: Partial<MyVehicle>): MyVehicle =>
  ({
    id: `m-${Math.random()}`,
    brand: "Toyota",
    model: "Corolla XEi",
    year_model: "2023/2024",
    km: 10000,
    price: 150000,
    base_company_id: null,
    created_at: "",
    updated_at: "",
    created_by: null,
    source: "manual",
    supplier_name: null,
    ...over,
  }) as MyVehicle;

const comp = (over: Partial<CompetitorVehicle>): CompetitorVehicle =>
  ({
    id: `c-${Math.random()}`,
    brand: "Toyota",
    model: "Corolla XEi",
    year_model: "2023/2024",
    km: 12000,
    price: 148000,
    competitor_id: null,
    competitor_name: "Loja X",
    confidence: null,
    created_at: "",
    updated_at: "",
    extraction_id: null,
    photo_url: null,
    source: null,
    source_url: null,
    version: null,
    city: null,
    ...over,
  }) as CompetitorVehicle;

/** Pool misto: 3 verdadeiros equivalentes + 5 ruídos típicos. */
function buildPool(): CompetitorVehicle[] {
  return [
    comp({ id: "ok-1", price: 148000 }),
    comp({ id: "ok-2", price: 152000, competitor_name: "Loja Y" }),
    comp({ id: "ok-3", price: 145000, competitor_name: "Loja Z" }),
    // Ruídos — devem ser rejeitados pelo Comparison Engine
    comp({ id: "noise-cross", model: "Corolla Cross XEi", price: 170000 }),
    comp({ id: "noise-year", year_model: "2020/2021", price: 110000 }),
    comp({ id: "noise-brand", brand: "Honda", model: "Civic", price: 140000 }),
    comp({ id: "noise-trim", model: "Corolla GLi", price: 130000 }),
    comp({ id: "noise-price", price: 0 }), // preço inválido
  ];
}

describe("Comparison Engine como gatekeeper único", () => {
  const subject = me({});
  const pool = buildPool();
  const approved = pool.filter(
    (c) => typeof c.price === "number" && c.price > 0 && isEquivalent(subject, c),
  );

  it("baseline: pool tem ruído mas apenas 3 equivalentes válidos", () => {
    expect(approved.map((c) => c.id).sort()).toEqual(["ok-1", "ok-2", "ok-3"]);
  });

  it("equivalentsFor (Comparações) só retorna aprovados", () => {
    const eq = equivalentsFor(subject, pool);
    expect(eq).toHaveLength(approved.length);
    eq.forEach((c) => expect(isEquivalent(subject, c)).toBe(true));
  });

  it("intelligenceFor agrega métricas SOMENTE sobre aprovados", () => {
    const intel = intelligenceFor(subject, pool);
    const prices = approved.map((c) => c.price as number);
    expect(intel.competitorCount).toBe(prices.length);
    expect(intel.min).toBe(Math.min(...prices));
    expect(intel.max).toBe(Math.max(...prices));
    // Ruídos de preço alto/baixo não vazaram para min/max:
    expect(intel.max).toBeLessThan(170000);
    expect(intel.min).toBeGreaterThan(110000);
  });

  it("Radar deriva prioridade/ação a partir do intel filtrado", () => {
    const intel = intelligenceFor(subject, pool);
    const priority = priorityFor(intel);
    const action = radarActionFor(intel, priority);
    expect(priority).not.toBe("none"); // há equivalentes
    expect(action.kind).not.toBe("insufficient_data");
  });

  it("Radar reporta 'none' / insufficient_data quando há SÓ ruído", () => {
    const onlyNoise = pool.filter((c) => c.id.startsWith("noise"));
    const intel = intelligenceFor(subject, onlyNoise);
    expect(intel.competitorCount).toBe(0);
    expect(priorityFor(intel)).toBe("none");
    expect(radarActionFor(intel, "none").kind).toBe("insufficient_data");
  });

  it("Estratégia de Preço usa apenas preços aprovados nos cenários", () => {
    const intel = intelligenceFor(subject, pool);
    const eqPrices = equivalentsFor(subject, pool).map((c) => c.price as number);
    const row = strategyFor(subject, intel, eqPrices);
    // Total ranqueado = aprovados + meu
    row.scenarios.forEach((s) => {
      if (s.applicable) {
        expect(s.totalRanked).toBe(approved.length + 1);
      }
    });
    expect(row.recommendation.kind).not.toBe("insufficient_data");
  });

  it("Matcher (Comparações) descarta pares com score < 80", () => {
    const result = matchInventoryAgainstCompetitor([subject], pool);
    // Todo match aceito deve ser equivalente estrito.
    result.matches.forEach((m) => {
      expect(isEquivalent(m.myVehicle, m.competitorVehicle)).toBe(true);
      expect(m.score.total).toBeGreaterThanOrEqual(80);
    });
    // Ruídos (Cross, ano errado, marca errada, trim diferente) NÃO aparecem
    // como match aceito, mesmo que sobrem como oportunidades.
    const matchedIds = new Set(result.matches.map((m) => m.competitorVehicle.id));
    ["noise-cross", "noise-year", "noise-brand", "noise-trim"].forEach((id) =>
      expect(matchedIds.has(id)).toBe(false),
    );
  });

  it("Consulta Global: filtro brand+modelCompact+year reproduz Comparison Engine", () => {
    // Reproduz o pré-filtro usado por globalSearchService.search quando o ano
    // é informado (caminho principal). O resultado deve coincidir com
    // equivalentsFor — provando que a Consulta Global não exibe nada além
    // do que o Comparison Engine aprovaria.
    const bBrand = modelCompactOf
      ? undefined
      : undefined; /* evita import não usado em ambientes futuros */
    void bBrand;
    const queryBrand = "Toyota";
    const queryModel = "Corolla XEi";
    const queryYear = "2024";

    const normBrand = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    const modelCompact = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, " ")
        .replace(/\s+/g, "")
        .trim();
    const yearOf = (s: string | null) => (s?.match(/\d{4}/)?.[0] ?? null);

    const bBrandN = normBrand(queryBrand);
    const bModelN = modelCompact(queryModel);

    const filtered = pool.filter(
      (c) =>
        typeof c.price === "number" &&
        (c.price as number) > 0 &&
        normBrand(c.brand) === bBrandN &&
        modelCompact(c.model) === bModelN &&
        yearOf(c.year_model) === queryYear,
    );

    const approvedIds = new Set(equivalentsFor(subject, pool).map((c) => c.id));
    const filteredIds = new Set(filtered.map((c) => c.id));
    expect(filteredIds).toEqual(approvedIds);
  });
});
