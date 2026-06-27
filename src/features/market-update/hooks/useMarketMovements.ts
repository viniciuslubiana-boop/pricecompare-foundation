import { useQuery } from "@tanstack/react-query";
import { marketMovementsService } from "../services/market-movements.service";

export const marketMovementsKeys = {
  all: ["market-movements"] as const,
  window: (hours: number | "all") => ["market-movements", "window", hours] as const,
  range: (since: string, until?: string) =>
    ["market-movements", "range", since, until ?? ""] as const,
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

export function useMarketMonitor(params: { sinceISO: string; untilISO?: string }) {
  return useQuery({
    queryKey: marketMovementsKeys.range(params.sinceISO, params.untilISO),
    queryFn: () => marketMovementsService.loadByDateRange(params.sinceISO, params.untilISO),
    staleTime: 30_000,
  });
}

