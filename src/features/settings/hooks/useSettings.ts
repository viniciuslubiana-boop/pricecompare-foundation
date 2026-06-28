import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "../services/settings.service";
import {
  DEFAULT_SETTINGS,
  type AppSettingsBundle,
  type SettingsKey,
} from "../types/settings.types";

const KEY = ["app-settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => settingsService.loadAll(),
    staleTime: 60_000,
    initialData: DEFAULT_SETTINGS,
  });
}

export function useSaveSettingsSection<K extends SettingsKey>(section: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: AppSettingsBundle[K]) => settingsService.saveSection(section, value),
    onSuccess: (value) => {
      qc.setQueryData<AppSettingsBundle>(KEY, (old) =>
        old ? { ...old, [section]: value } : old,
      );
      toast.success("Configurações salvas.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Falha ao salvar configurações.");
    },
  });
}
