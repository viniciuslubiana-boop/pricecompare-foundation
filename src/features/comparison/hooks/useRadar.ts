import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { radarService } from "../services/radar.service";
import { applyRadarFilters } from "@/features/analytics/calculators/radar-summary";
import type { RadarFilters } from "../types/comparison.types";

export const radarKeys = {
  all: ["radar"] as const,
  list: (competitorName?: string) => [...radarKeys.all, { competitorName: competitorName ?? null }] as const,
};

export function useRadar() {
  const [filters, setFilters] = useState<RadarFilters>({});

  const query = useQuery({
    queryKey: radarKeys.list(filters.competitorName),
    queryFn: () => radarService.run({ competitorName: filters.competitorName }),
    staleTime: 30_000,
  });

  const filteredRows = useMemo(() => {
    const base = query.data?.actionableRows ?? [];
    return applyRadarFilters(base, filters);
  }, [query.data, filters]);

  return {
    ...query,
    filters,
    setFilters,
    filteredRows,
  };
}
