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
    onSuccess: (_data, id) => {
      qc.setQueryData<Array<{ id: string }> | undefined>(KEY, (old) =>
        Array.isArray(old) ? old.filter((l) => l.id !== id) : old,
      );
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
      const { rowsReceived, rowsImported, rowsDuplicateIgnored, rowsInvalid, rowsInsertError } =
        result;
      const rowsWithError = rowsInvalid + rowsInsertError;
      const report =
        `Lidas: ${rowsReceived} · Importadas: ${rowsImported} · ` +
        `Duplicadas ignoradas: ${rowsDuplicateIgnored} · Com erro: ${rowsWithError} · Status: ${result.status}`;

      if (result.status === "no_changes") {
        toast.info("Nenhuma linha nova importada. Todos os veículos já existiam no estoque.", {
          description: report,
        });
      } else if (result.status === "completed" && rowsDuplicateIgnored === 0) {
        toast.success("Importação concluída com sucesso.", { description: report });
      } else if (result.status === "completed") {
        toast.success(
          `Importação concluída. ${rowsImported} linhas importadas e ${rowsDuplicateIgnored} duplicadas ignoradas.`,
          { description: report },
        );
      } else if (result.status === "partial") {
        toast.warning(
          `Importação parcial. ${rowsImported} linhas importadas e ${rowsWithError} linhas com erro.`,
          { description: report },
        );
      } else {
        toast.error("Importação falhou. Nenhuma linha pôde ser processada.", {
          description: report,
        });
      }
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: Error) => toast.error("Erro na importação", { description: e.message }),
  });
}
