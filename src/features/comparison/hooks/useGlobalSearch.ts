import { useQuery } from "@tanstack/react-query";
import { globalSearchService, type GlobalSearchQuery } from "../services/global-search.service";

export function useGlobalSearch(query: GlobalSearchQuery | null) {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: () => globalSearchService.search(query!),
    enabled: !!query && !!query.brand?.trim() && !!query.model?.trim(),
    staleTime: 30_000,
  });
}
