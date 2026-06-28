import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/features/admin/services/audit.service";
import {
  DEFAULT_SETTINGS,
  type AppSettingsBundle,
  type SettingsKey,
} from "../types/settings.types";

/**
 * Settings Service — ponto único de leitura/escrita de configurações.
 * Cada seção é armazenada como uma linha em `app_settings` (key/value JSON).
 */
export const settingsService = {
  async loadAll(): Promise<AppSettingsBundle> {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", Object.keys(DEFAULT_SETTINGS));
    if (error) throw error;

    const bundle: AppSettingsBundle = structuredClone(DEFAULT_SETTINGS);
    for (const row of data ?? []) {
      const key = row.key as SettingsKey;
      if (key in bundle && row.value && typeof row.value === "object") {
        // shallow merge para preservar defaults em campos novos
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (bundle as any)[key] = { ...(bundle as any)[key], ...(row.value as object) };
      }
    }
    return bundle;
  },

  async saveSection<K extends SettingsKey>(
    key: K,
    value: AppSettingsBundle[K],
  ): Promise<AppSettingsBundle[K]> {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value: value as unknown as Record<string, unknown> }, { onConflict: "key" });
    if (error) throw error;

    // best-effort audit log
    try {
      await auditService.log({
        action: "settings_updated",
        module: "settings",
        newData: { key, value },
      });
    } catch {
      // ignore audit failures
    }
    return value;
  },
};
