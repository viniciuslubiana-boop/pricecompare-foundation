import { useQuery } from "@tanstack/react-query";
import { analyticsKeys } from "@/features/analytics";
import { dashboardService } from "../services/dashboard.service";

export const dashboardKeys = {
  all: [...analyticsKeys.all, "dashboard"] as const,
  scoped: (baseCompanyId?: string | null) =>
    [...analyticsKeys.all, "dashboard", baseCompanyId ?? "all"] as const,
};

/**
 * Hook único de dados do Dashboard Executivo.
 * A tela do Dashboard só pode consumir este hook — nenhuma consulta direta
 * a Supabase nem cálculo de KPI na camada de UI.
 */
export function useDashboardData(baseCompanyId?: string | null) {
  return useQuery({
    queryKey: dashboardKeys.scoped(baseCompanyId),
    queryFn: () => dashboardService.getDashboardSummary(baseCompanyId),
    staleTime: 30_000,
  });
}

// Alias para compatibilidade com chamadas existentes.
export const useDashboard = useDashboardData;
