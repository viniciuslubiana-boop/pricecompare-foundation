import { useQuery } from "@tanstack/react-query";
import { marketMovementsService } from "../services/market-movements.service";

export const marketMovementsKeys = {
  all: ["market-movements"] as const,
  window: (hours: number | "all") => ["market-movements", "window", hours] as const,
  run: (runId: string) => ["market-movements", "run", runId] as const,
};

export function useMarketMovements(params: { sinceHours?: number | "all" } = {}) {
  const hours = params.sinceHours ?? 24;
  return useQuery({
    queryKey: marketMovementsKeys.window(hours),
    queryFn: () =>
      marketMovementsService.loadByWindowHours(hours === "all" ? undefined : hours),
    staleTime: 30_000,
  });
}
