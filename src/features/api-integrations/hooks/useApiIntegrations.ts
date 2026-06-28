import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { apiIntegrationsClient } from "../services/api-integrations.queries";
import {
  createApiIntegration,
  deleteApiIntegration,
  runApiIntegration,
  testApiIntegration,
  updateApiIntegration,
} from "../services/api-integrations.functions";
import type { ApiIntegrationInput } from "../types";

type UpdatePayload = ApiIntegrationInput & { id: string };


const KEY = ["api-integrations"] as const;
const LOGS_KEY = ["api-integration-logs"] as const;

export function useApiIntegrations() {
  return useQuery({ queryKey: KEY, queryFn: () => apiIntegrationsClient.list() });
}

export function useApiIntegrationLogs(integrationId?: string) {
  return useQuery({
    queryKey: [...LOGS_KEY, integrationId ?? "all"],
    queryFn: () => apiIntegrationsClient.listLogs(integrationId),
  });
}

export function useApiIntegrationMutations() {
  const qc = useQueryClient();
  const createFn = useServerFn(createApiIntegration);
  const updateFn = useServerFn(updateApiIntegration);
  const deleteFn = useServerFn(deleteApiIntegration);
  const testFn = useServerFn(testApiIntegration);
  const runFn = useServerFn(runApiIntegration);

  const create = useMutation({
    mutationFn: (data: ApiIntegrationInput) => createFn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Integração cadastrada.");
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  const update = useMutation({
    mutationFn: (data: UpdatePayload) => updateFn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Integração atualizada.");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });


  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Integração removida.");
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });

  const test = useMutation({
    mutationFn: (id: string) => testFn({ data: { id } }),
    onSuccess: (result) => {
      if (result.ok) toast.success(result.message);
      else toast.error("Falha no teste", { description: result.message });
    },
    onError: (e: Error) => toast.error("Erro ao testar", { description: e.message }),
  });

  const run = useMutation({
    mutationFn: (id: string) => runFn({ data: { id } }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["competitors"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      if (result.status === "success") toast.success(result.message);
      else if (result.status === "empty") toast.message(result.message);
      else toast.error("Falha na atualização", { description: result.message });
    },
    onError: (e: Error) => toast.error("Erro ao executar", { description: e.message }),
  });

  return { create, update, remove, test, run };
}
