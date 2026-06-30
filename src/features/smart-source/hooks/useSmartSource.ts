import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listSourceHistory,
  listSourceProfiles,
  recordSourceExecution,
  selectSource,
} from "../services/smart-source.functions";
import type {
  SmartSourceInput,
  SmartSourceSelection,
  SourceExecutionInput,
  SourceHistoryRow,
  SourceProfileRow,
} from "../types";

const HISTORY_KEY = ["smart-source", "history"] as const;
const PROFILES_KEY = ["smart-source", "profiles"] as const;

export function useSourceHistory() {
  const fn = useServerFn(listSourceHistory);
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: () => fn() as Promise<SourceHistoryRow[]>,
  });
}

export function useSourceProfiles() {
  const fn = useServerFn(listSourceProfiles);
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: () => fn() as Promise<SourceProfileRow[]>,
  });
}

export function useSelectSource() {
  const fn = useServerFn(selectSource);
  return useMutation({
    mutationFn: (input: SmartSourceInput) =>
      fn({ data: input }) as Promise<SmartSourceSelection>,
    onError: (err: Error) =>
      toast.error(err.message || "Falha ao selecionar fonte."),
  });
}

export function useRecordSourceExecution() {
  const fn = useServerFn(recordSourceExecution);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SourceExecutionInput) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      qc.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}
