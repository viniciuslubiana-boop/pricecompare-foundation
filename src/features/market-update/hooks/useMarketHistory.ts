import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketHistoryService } from "../services/market-history.service";
import {
  applyHistoryFilters,
  summarizeHistory,
  aggregatePerVehicle,
  type HistoryFilters,
} from "@/features/analytics/calculators/market-history";

export const marketHistoryKeys = {
  all: ["market-history"] as const,
  bundle: (sinceHours?: number) =>
    ["market-history", "bundle", sinceHours ?? "all"] as const,
};

export function useMarketHistory(params: { sinceHours?: number } = {}) {
  return useQuery({
    queryKey: marketHistoryKeys.bundle(params.sinceHours),
    queryFn: () => marketHistoryService.load({ sinceHours: params.sinceHours }),
    staleTime: 30_000,
  });
}

export function useDerivedHistory(
  bundle: Awaited<ReturnType<typeof marketHistoryService.load>> | undefined,
  filters: Omit<HistoryFilters, "stockKeys">,
) {
  return useMemo(() => {
    const rows = bundle?.rows ?? [];
    const stockKeys = bundle?.stockKeys ?? new Set<string>();
    const effective: HistoryFilters = { ...filters, stockKeys };
    const filtered = applyHistoryFilters(rows, effective);
    const summary = summarizeHistory(filtered, stockKeys);
    const summaryAll = summarizeHistory(rows, stockKeys);
    const perVehicle = aggregatePerVehicle(filtered, {
      currentPriceByKey: bundle?.currentPriceByVehicleKey,
      stockKeys,
    });
    return { filtered, summary, summaryAll, perVehicle };
  }, [bundle, filters]);
}
