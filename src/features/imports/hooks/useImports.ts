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
      const parts: string[] = [];
      if (result.rowsImported) parts.push(`${result.rowsImported} importadas`);
      if (result.rowsDuplicateIgnored) parts.push(`${result.rowsDuplicateIgnored} duplicadas ignoradas`);
      if (result.rowsInvalid) parts.push(`${result.rowsInvalid} inválidas`);
      if (result.rowsInsertError) parts.push(`${result.rowsInsertError} erros ao salvar`);
      const description = parts.join(" · ") || "Nenhuma linha processada";
      const firstError = result.errorLog[0]?.errors?.[0];

      if (result.status === "completed") {
        toast.success(`Importação concluída: ${result.rowsImported} veículos`, { description });
      } else if (result.status === "partial") {
        toast.warning("Importação parcial", { description });
      } else if (result.status === "no_changes") {
        toast.info("Nenhuma linha nova importada", {
          description: `${result.rowsDuplicateIgnored} linha(s) já existiam no estoque e foram ignoradas. Escolha "Importar mesmo assim" para forçar.`,
        });
      } else {
        toast.error("Importação falhou", {
          description: firstError ? `${description} — Ex.: ${firstError}` : description,
        });
      }
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: Error) => toast.error("Erro na importação", { description: e.message }),
  });
}
