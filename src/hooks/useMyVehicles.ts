import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vehicleService } from "@/features/vehicles/vehicle.service";
import type { VehicleFilters } from "@/features/vehicles/vehicle.types";
import type { VehicleFormValues } from "@/features/vehicles/vehicle.schema";
import { useAuth } from "@/hooks/useAuth";

const KEY = ["my_vehicles"] as const;

export function useMyVehicles(filters: VehicleFilters) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => vehicleService.list(filters),
  });
}

export function useVehicleBrands() {
  return useQuery({
    queryKey: [...KEY, "brands"],
    queryFn: () => vehicleService.listBrands(),
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (values: VehicleFormValues) => {
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      return vehicleService.create(values, user.id);
    },
    onSuccess: () => {
      toast.success("Veículo cadastrado com sucesso");
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
    mutationFn: ({ id, values }: { id: string; values: VehicleFormValues }) =>
      vehicleService.update(id, values),
    onSuccess: () => {
      toast.success("Veículo atualizado");
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
    mutationFn: (id: string) => vehicleService.remove(id),
    onSuccess: () => {
      toast.success("Veículo excluído");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao excluir veículo", { description: err.message });
    },
  });
}
