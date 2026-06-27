import { useQuery } from "@tanstack/react-query";
import { analyticsService, analyticsKeys } from "@/features/analytics";
import { extractionRepository } from "@/repositories/extraction.repository";
import { importLogRepository } from "@/repositories/import.repository";

export const operationsKeys = {
  all: ["operations"] as const,
  summary: () => [...operationsKeys.all, "summary"] as const,
};

export interface ActivityItem {
  id: string;
  kind: "import" | "extraction" | "comparison";
  title: string;
  status: string;
  at: string; // ISO date
}

export interface OperationsSummary {
  totals: {
    myVehicles: number;
    competitors: number;
    competitorVehicles: number;
    comparisons: number;
    imports: number;
    extractions: number;
  };
  lastUpdated: {
    inventory: string | null;
    competitors: string | null;
    imports: string | null;
    extractions: string | null;
    comparisons: string | null;
  };
  errors: {
    imports: number;
    extractions: number;
  };
  opportunities: number;
  activities: ActivityItem[];
}

function maxDate(arr: Array<string | null | undefined>): string | null {
  const dates = arr.filter((d): d is string => !!d);
  if (!dates.length) return null;
  return dates.reduce((a, b) => (a > b ? a : b));
}

export function useOperations() {
  return useQuery({
    queryKey: operationsKeys.summary(),
    queryFn: async (): Promise<OperationsSummary> => {
      const [snap, imports, extractions] = await Promise.all([
        analyticsService.loadSnapshot(),
        importLogRepository.list(),
        extractionRepository.list(),
      ]);

      const importErrors = imports.filter((i) => i.status === "failed").length;
      const extractionErrors = extractions.filter((e) => e.status === "failed").length;

      const competitorNameById = new Map(snap.competitors.map((c) => [c.id, c.name]));

      const activities: ActivityItem[] = [
        ...imports.slice(0, 5).map((i) => ({
          id: `i-${i.id}`,
          kind: "import" as const,
          title: i.file_name ?? "Importação",
          status: i.status ?? "unknown",
          at: i.created_at,
        })),
        ...extractions.slice(0, 5).map((e) => ({
          id: `e-${e.id}`,
          kind: "extraction" as const,
          title:
            (e.competitor_id ? competitorNameById.get(e.competitor_id) : null) ??
            "Extração",
          status: e.status,
          at: e.created_at,
        })),
        ...snap.comparisons.slice(0, 5).map((c) => ({
          id: `c-${c.id}`,
          kind: "comparison" as const,
          title: `Comparação ${c.winner ?? ""}`.trim(),
          status: c.winner ?? "unmatched",
          at: c.created_at,
        })),
      ]
        .sort((a, b) => (a.at > b.at ? -1 : 1))
        .slice(0, 10);

      const opportunities = snap.comparisons.filter(
        (c) => c.winner === "competitor",
      ).length;

      return {
        totals: {
          myVehicles: snap.myVehicles.length,
          competitors: snap.competitors.length,
          competitorVehicles: snap.competitorVehicles.length,
          comparisons: snap.comparisons.length,
          imports: imports.length,
          extractions: extractions.length,
        },
        lastUpdated: {
          inventory: maxDate(snap.myVehicles.map((v) => v.updated_at ?? v.created_at)),
          competitors: maxDate(snap.competitors.map((c) => c.updated_at ?? c.created_at)),
          imports: maxDate(imports.map((i) => i.created_at)),
          extractions: maxDate(extractions.map((e) => e.created_at)),
          comparisons: maxDate(snap.comparisons.map((c) => c.created_at)),
        },
        errors: { imports: importErrors, extractions: extractionErrors },
        opportunities,
        activities,
      };
    },
    staleTime: 30_000,
  });
}

// Keep analytics keys alongside for combined invalidation
export const operationsRelatedKeys = analyticsKeys.all;
