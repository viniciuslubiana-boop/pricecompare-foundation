import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loadCatalogAudit, vehicleCatalogService } from "./service";
import type { VehicleMasterCatalogInput } from "./types";

const KEY = ["vehicle-master-catalog"] as const;
const AUDIT_KEY = ["vehicle-master-catalog", "audit"] as const;

export function useVehicleCatalog() {
  return useQuery({ queryKey: KEY, queryFn: () => vehicleCatalogService.list() });
}

export function useCatalogAudit() {
  return useQuery({ queryKey: AUDIT_KEY, queryFn: () => loadCatalogAudit() });
}

export function useCreateCatalogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleMasterCatalogInput) => vehicleCatalogService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
      toast.success("Modelo adicionado ao catálogo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCatalogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<VehicleMasterCatalogInput> }) =>
      vehicleCatalogService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
      toast.success("Modelo atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleCatalogActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      vehicleCatalogService.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCatalogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleCatalogService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
      toast.success("Modelo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
