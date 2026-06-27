import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketChangesRepository } from "../repositories/market-changes.repository";
import {
  applyChangeFilters,
  summarizeChanges,
  type ChangeFilters,
  type MarketChangesSummary,
} from "@/features/analytics/calculators/market-changes";
import type { MarketChangeRow } from "../types";

export const marketChangesKeys = {
  all: ["market-changes"] as const,
  list: (since?: string) => ["market-changes", "list", since ?? "all"] as const,
};

export function useMarketChanges(params: { sinceHours?: number } = {}) {
  const since = useMemo(() => {
    if (!params.sinceHours) return undefined;
    return new Date(Date.now() - params.sinceHours * 3600_000).toISOString();
  }, [params.sinceHours]);

  return useQuery({
    queryKey: marketChangesKeys.list(since),
    queryFn: () => marketChangesRepository.list({ since, limit: 1000 }),
    staleTime: 30_000,
  });
}

export function useFilteredChanges(rows: MarketChangeRow[] | undefined, filters: ChangeFilters) {
  return useMemo(() => {
    const safe = rows ?? [];
    const filtered = applyChangeFilters(safe, filters);
    const summary: MarketChangesSummary = summarizeChanges(filtered);
    const summaryAll: MarketChangesSummary = summarizeChanges(safe);
    return { filtered, summary, summaryAll };
  }, [rows, filters]);
}
