import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inventoryService } from "../services/inventory.service";
import { findDuplicates } from "../utils/inventory-duplicates";
import type { InventoryFilters } from "../types/inventory.types";
import type { InventoryFormValues } from "../schemas/inventory.schema";
import { useAuth } from "@/hooks/useAuth";

const KEY = ["inventory"] as const;

export function useInventoryList(filters: InventoryFilters) {
  return useQuery({
    queryKey: [...KEY, "list", filters],
    queryFn: () => inventoryService.list(filters),
  });
}

export function useInventoryBrands() {
  return useQuery({
    queryKey: [...KEY, "brands"],
    queryFn: () => inventoryService.listBrands(),
  });
}

function warnDuplicates(matches: ReturnType<typeof findDuplicates>) {
  if (!matches.length) return;
  const first = matches[0];
  toast.warning("Possível duplicidade detectada", {
    description: `${first.vehicle.brand} ${first.vehicle.model} (${first.vehicle.year_model}) — ${first.reasons.join(", ")}.`,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      const existing = await inventoryService.list({});
      const dups = findDuplicates(values, existing);
      const created = await inventoryService.create(values, user.id);
      return { created, dups };
    },
    onSuccess: ({ dups }) => {
      toast.success("Veículo cadastrado com sucesso");
      warnDuplicates(dups);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao salvar veículo", { description: err.message });
    },
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: InventoryFormValues }) => {
      const existing = await inventoryService.list({});
      const dups = findDuplicates(values, existing, { excludeId: id });
      const updated = await inventoryService.update(id, values);
      return { updated, dups };
    },
    onSuccess: ({ dups }) => {
      toast.success("Veículo atualizado");
      warnDuplicates(dups);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao atualizar veículo", { description: err.message });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.remove(id),
    onSuccess: (_data, id) => {
      // 1) Remoção imediata do item em todas as listas em cache
      qc.setQueriesData<Array<{ id: string }> | undefined>(
        { queryKey: [...KEY, "list"] },
        (old) => (Array.isArray(old) ? old.filter((v) => v.id !== id) : old),
      );
      toast.success("Veículo excluído");
      // 2) Refetch para garantir consistência com o servidor
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao excluir veículo", { description: err.message });
    },
  });
}
