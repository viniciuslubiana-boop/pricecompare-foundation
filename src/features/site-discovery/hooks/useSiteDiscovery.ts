import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  discoverSite,
  listSiteDiscoveries,
} from "../services/site-discovery.functions";
import type { SiteDiscoveryInput, SiteDiscoveryResult } from "../types";


const KEY = ["site-discovery"] as const;

export function useSiteDiscoveries() {
  const fn = useServerFn(listSiteDiscoveries);
  return useQuery({
    queryKey: KEY,
    queryFn: () => fn(),
  });
}

export function useDiscoverSite() {
  const fn = useServerFn(discoverSite);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SiteDiscoveryInput) =>
      fn({ data: input }) as Promise<SiteDiscoveryResult>,
    onSuccess: (result) => {
      toast.success(
        `Tecnologia detectada: ${result.technology} (${result.confidence.toFixed(0)}%)`,
      );
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Falha ao detectar tecnologia.");
    },
  });
}

