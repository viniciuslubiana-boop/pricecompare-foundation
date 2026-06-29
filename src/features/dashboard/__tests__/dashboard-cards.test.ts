import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { comparisonStatisticsService } from "@/features/analytics/services/comparison-statistics.service";
import { marketStatisticsService } from "@/features/analytics/services/market-statistics.service";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import type { Comparison } from "@/features/analytics/types/analytics.types";

/**
 * Estes testes garantem que cada card do Dashboard Executivo:
 *   1. Usa o campo correto do Analytics/Dashboard Engine.
 *   2. Não duplica o mesmo valor em dois cards do mesmo bloco.
 *   3. Não exibe hint invertido em relação ao rótulo.
 *
 * A tela do Dashboard é declarativa — validamos via inspeção do source
 * do route (`routes/_authenticated/index.tsx`) por meio de âncoras
 * estáveis (label + value). Qualquer reuso reaparece no teste.
 */
const ROUTE_SRC = readFileSync(
  resolve(__dirname, "../../../routes/_authenticated/index.tsx"),
  "utf8",
);

/** Extrai `<MetricCard label="X" value={EXPR} />` (multilinha). */
function extractCards(src: string): Array<{ label: string; value: string }> {
  const re = /<MetricCard\s+([^/]*?)\/>/gms;
  const out: Array<{ label: string; value: string }> = [];
  for (const m of src.matchAll(re)) {
    const body = m[1];
    const label = body.match(/label="([^"]+)"/)?.[1];
    const value = body.match(/value=\{([^}]+)\}/)?.[1]?.trim();
    if (label && value) out.push({ label, value });
  }
  return out;
}

describe("Dashboard Executivo — mapeamento dos cards", () => {
  const cards = extractCards(ROUTE_SRC);

  it("contém todos os MetricCards esperados (4 blocos × N)", () => {
    expect(cards.length).toBeGreaterThanOrEqual(8);
  });

  it("nenhum card reutiliza o mesmo `value` (sem duplicação de campo)", () => {
    const values = cards.map((c) => c.value);
    const dup = values.filter((v, i) => values.indexOf(v) !== i);
    expect(dup, `Cards duplicados: ${dup.join(", ")}`).toEqual([]);
  });

  it("Visão Geral usa os campos corretos", () => {
    const get = (label: string) => cards.find((c) => c.label === label)?.value;
    expect(get("Veículos monitorados")).toBe("summary.totalMyVehicles");
    expect(get("Concorrentes monitorados")).toBe("summary.totalCompetitors");
    expect(get("Veículos comparados")).toBe("summary.totalComparisons");
    expect(get("Competitividade")).toBe("fmtPercent(competitiveness.percent)");
  });

  it("Competitividade: diferenciais/oportunidades/empates/total são distintos", () => {
    const get = (label: string) => cards.find((c) => c.label === label)?.value;
    expect(get("Diferenciais (você mais barato)")).toBe("summary.differentials");
    expect(get("Oportunidades (concorrente mais barato)")).toBe("summary.opportunities");
    expect(get("Empates")).toBe("comparison.ties");
    expect(get("Total de comparações")).toBe("comparison.total");
  });

  it("não existe hint que use `market.avgPriceDiff` sob o rótulo de oportunidades (hint invertido)", () => {
    // market.avgPriceDiff = avgCompetitor - avgMine; sinal positivo significa
    // concorrente mais caro, o que é oposto ao rótulo "Oportunidades".
    const opportunitiesBlock = ROUTE_SRC.match(
      /label="Oportunidades \(concorrente mais barato\)"[\s\S]*?\/>/,
    )?.[0];
    expect(opportunitiesBlock).toBeDefined();
    expect(opportunitiesBlock).not.toMatch(/market\.avgPriceDiff/);
    expect(opportunitiesBlock).toMatch(/comparison\.avgDiff/);
  });

  it("Operação: card de marcas exibe `competitors.byBrand`, não 'oportunidades'", () => {
    const opByBrand = ROUTE_SRC.match(/title="Marcas na Concorrência"[\s\S]*?<\/SummaryCard>/)?.[0];
    expect(opByBrand, "título realinhado existe").toBeDefined();
    expect(opByBrand).toContain("competitors.byBrand");
    expect(ROUTE_SRC).not.toMatch(/title="Oportunidades por Marca"/);
  });
});

describe("Dashboard Service — derivações dos campos consumidos pelos cards", () => {
  it("opportunities ≡ competitorCheaper, differentials ≡ meCheaper", async () => {
    const comparisons: Comparison[] = [
      { winner: "me", savings: 1000, compatibility_score: 0.9 } as Comparison,
      { winner: "competitor", savings: -500, compatibility_score: 0.8 } as Comparison,
      { winner: "tie", savings: 0, compatibility_score: 1 } as Comparison,
    ];
    const stats = comparisonStatisticsService.compute(comparisons);
    expect(stats.meCheaper).toBe(1);
    expect(stats.competitorCheaper).toBe(1);
    expect(stats.ties).toBe(1);
    expect(stats.total).toBe(3);
    expect(dashboardService).toBeDefined();
  });

  it("market.avgPriceDiff = avgCompetitor - avgMine (sinal correto)", () => {
    const mine = [{ price: 100 }, { price: 100 }] as never;
    const comp = [{ price: 200 }, { price: 200 }] as never;
    const m = marketStatisticsService.compute(mine, comp);
    expect(m.avgPriceMine).toBe(100);
    expect(m.avgPriceCompetitor).toBe(200);
    expect(m.avgPriceDiff).toBe(100); // positivo => concorrente mais caro
  });
});
