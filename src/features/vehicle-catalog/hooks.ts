import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  loadCatalogAudit,
  loadCoverageReport,
  suggestAliases,
  vehicleAliasService,
  vehicleCatalogService,
} from "./service";
import type { VehicleAliasInput, VehicleMasterCatalogInput } from "./types";

const KEY = ["vehicle-master-catalog"] as const;
const AUDIT_KEY = ["vehicle-master-catalog", "audit"] as const;
const ALIAS_KEY = ["vehicle-model-aliases"] as const;
const COVERAGE_KEY = ["vehicle-master-catalog", "coverage"] as const;
const SUGGEST_KEY = ["vehicle-model-aliases", "suggestions"] as const;

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: AUDIT_KEY });
  qc.invalidateQueries({ queryKey: ALIAS_KEY });
  qc.invalidateQueries({ queryKey: COVERAGE_KEY });
  qc.invalidateQueries({ queryKey: SUGGEST_KEY });
}

export function useVehicleCatalog() {
  return useQuery({ queryKey: KEY, queryFn: () => vehicleCatalogService.list() });
}

export function useCatalogAudit() {
  return useQuery({ queryKey: AUDIT_KEY, queryFn: () => loadCatalogAudit() });
}

export function useCoverageReport() {
  return useQuery({ queryKey: COVERAGE_KEY, queryFn: () => loadCoverageReport() });
}

export function useAliasSuggestions() {
  return useQuery({
    queryKey: SUGGEST_KEY,
    queryFn: () => suggestAliases(),
    enabled: false,
  });
}

export function useAliases() {
  return useQuery({ queryKey: ALIAS_KEY, queryFn: () => vehicleAliasService.list() });
}

export function useCreateCatalogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleMasterCatalogInput) => vehicleCatalogService.create(input),
    onSuccess: () => {
      invalidateAll(qc);
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
      invalidateAll(qc);
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
    onSuccess: () => invalidateAll(qc),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCatalogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleCatalogService.remove(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Modelo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleAliasInput) => vehicleAliasService.create(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Alias vinculado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnlinkAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleAliasService.unlink(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Vínculo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleAliasService.remove(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Alias removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
