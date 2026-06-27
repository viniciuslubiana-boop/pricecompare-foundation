import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importLogRepository } from "@/repositories/import.repository";
import { runImport, type RunImportArgs } from "../services/import.service";

const KEY = ["import-logs"] as const;

export function useImportLogs() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => importLogRepository.list(),
  });
}

export function useDeleteImportLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importLogRepository.remove(id),
    onSuccess: () => {
      toast.success("Log removido");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error("Erro ao remover log", { description: e.message }),
  });
}

export function useRunImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: RunImportArgs) => runImport(args),
    onSuccess: (result) => {
      const map = {
        completed: () => toast.success(`Importação concluída: ${result.rowsImported} veículos`),
        partial: () =>
          toast.warning("Importação parcial", {
            description: `${result.rowsImported} importadas, ${result.rowsFailed} com falha`,
          }),
        failed: () => toast.error("Importação falhou", { description: "Nenhuma linha importada" }),
      };
      map[result.status]();
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: Error) => toast.error("Erro na importação", { description: e.message }),
  });
}
