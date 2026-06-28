import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baseCompaniesService } from "../services/base-companies.service";
import type { BaseCompanyInsert, BaseCompanyUpdate } from "../types";

const KEY = ["base-companies"] as const;

export function useBaseCompanies() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => baseCompaniesService.list(),
    staleTime: 30_000,
  });
}

export function useActiveBaseCompanies() {
  return useQuery({
    queryKey: [...KEY, "active"],
    queryFn: () => baseCompaniesService.listActive(),
    staleTime: 30_000,
  });
}

export function useCreateBaseCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BaseCompanyInsert) => baseCompaniesService.create(payload),
    onSuccess: () => {
      toast.success("Empresa Base cadastrada.");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });
}

export function useUpdateBaseCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BaseCompanyUpdate }) =>
      baseCompaniesService.update(id, payload),
    onSuccess: () => {
      toast.success("Empresa Base atualizada.");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });
}

export function useDeleteBaseCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => baseCompaniesService.remove(id),
    onSuccess: () => {
      toast.success("Empresa Base removida.");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) =>
      toast.error("Erro ao remover", {
        description:
          e.message.includes("foreign") || e.message.includes("violates")
            ? "Existem veículos vinculados. Inative a empresa em vez de excluí-la."
            : e.message,
      }),
  });
}
