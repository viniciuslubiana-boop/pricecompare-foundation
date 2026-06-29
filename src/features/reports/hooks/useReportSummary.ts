import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";

export function useReportSummary(baseCompanyId: string | null) {
  return useQuery({
    queryKey: ["reports", "summary", baseCompanyId],
    queryFn: () => reportsService.buildSummary(baseCompanyId),
    staleTime: 30_000,
  });
}
