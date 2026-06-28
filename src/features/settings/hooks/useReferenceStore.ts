import { useQuery } from "@tanstack/react-query";
import { settingsService } from "../services/settings.service";
import { DEFAULT_SETTINGS, type ReferenceStoreSettings } from "../types/settings.types";

const KEY = ["app-settings", "referenceStore"] as const;

/**
 * Loja de Referência — empresa base de TODAS as comparações do PCM.
 * Lê do app_settings (seção `referenceStore`). Garante singleton lógico.
 */
export function useReferenceStore() {
  return useQuery<ReferenceStoreSettings>({
    queryKey: KEY,
    queryFn: async () => {
      const bundle = await settingsService.loadAll();
      return bundle.referenceStore ?? DEFAULT_SETTINGS.referenceStore;
    },
    staleTime: 60_000,
    initialData: DEFAULT_SETTINGS.referenceStore,
  });
}
