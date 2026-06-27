import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { competitorService } from "../services/competitor.service";
import type { CompetitorFilters, CompetitorStatus } from "../types/competitor.types";
import type { CompetitorFormValues } from "../schemas/competitor.schema";
import { useAuth } from "@/hooks/useAuth";

const KEY = ["competitors"] as const;

export function useCompetitorsList(filters: CompetitorFilters) {
  return useQuery({
    queryKey: [...KEY, "list", filters],
    queryFn: () => competitorService.list(filters),
  });
}

export function useCreateCompetitor() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: CompetitorFormValues) => {
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      return competitorService.create(values, user.id);
    },
    onSuccess: () => {
      toast.success("Concorrente cadastrado");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao cadastrar concorrente", { description: err.message });
    },
  });
}

export function useUpdateCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CompetitorFormValues }) =>
      competitorService.update(id, values),
    onSuccess: () => {
      toast.success("Concorrente atualizado");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao atualizar concorrente", { description: err.message });
    },
  });
}

export function useSetCompetitorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CompetitorStatus }) =>
      competitorService.setStatus(id, status),
    onSuccess: (_data, vars) => {
      toast.success(vars.status === "active" ? "Concorrente ativado" : "Concorrente desativado");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao alterar status", { description: err.message });
    },
  });
}

export function useDeleteCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => competitorService.remove(id),
    onSuccess: () => {
      toast.success("Concorrente excluído");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => {
      toast.error("Erro ao excluir concorrente", { description: err.message });
    },
  });
}
