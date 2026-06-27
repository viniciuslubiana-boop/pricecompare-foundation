import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { strategyService } from "../services/strategy.service";
import { applyStrategyFilters } from "@/features/analytics/calculators/strategy-summary";
import type { StrategyFilters } from "../types/comparison.types";

export const strategyKeys = {
  all: ["strategy"] as const,
  list: (competitorName?: string) =>
    [...strategyKeys.all, { competitorName: competitorName ?? null }] as const,
};

export function useStrategy() {
  const [filters, setFilters] = useState<StrategyFilters>({ sort: "max_impact" });

  const query = useQuery({
    queryKey: strategyKeys.list(filters.competitorName),
    queryFn: () => strategyService.run({ competitorName: filters.competitorName }),
    staleTime: 30_000,
  });

  const filteredRows = useMemo(() => {
    const base = query.data?.recommendedRows ?? [];
    return applyStrategyFilters(base, filters);
  }, [query.data, filters]);

  return {
    ...query,
    filters,
    setFilters,
    filteredRows,
  };
}
