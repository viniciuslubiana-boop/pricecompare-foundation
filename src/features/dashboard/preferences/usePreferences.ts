import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_FILTERS,
  DEFAULT_PREFERENCES,
  DEFAULT_BLOCK_ORDER,
  type DashboardFilters,
  type DashboardLayout,
  type DashboardPreferences,
} from "./types";

type Patch = Partial<DashboardPreferences>;

function merge(base: DashboardPreferences, patch: Patch): DashboardPreferences {
  return {
    baseCompanyId: patch.baseCompanyId ?? base.baseCompanyId,
    filters: { ...base.filters, ...(patch.filters ?? {}) },
    layout: { ...base.layout, ...(patch.layout ?? {}) },
    favorites: patch.favorites ?? base.favorites,
    collapsed: patch.collapsed ?? base.collapsed,
    hidden: patch.hidden ?? base.hidden,
  };
}

/**
 * Persistência de preferências do Dashboard por usuário (RLS auth.uid()).
 * Optimista localmente; gravação debounced no Supabase.
 */
export function useDashboardPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("user_dashboard_preferences")
        .select("base_company_id, filters, layout, favorites, collapsed, hidden")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setPrefs({
          baseCompanyId: data.base_company_id ?? null,
          filters: { ...DEFAULT_FILTERS, ...((data.filters as Partial<DashboardFilters>) ?? {}) },
          layout: {
            blockOrder:
              (data.layout as DashboardLayout | null)?.blockOrder ?? DEFAULT_BLOCK_ORDER,
          },
          favorites: (data.favorites as string[] | null) ?? [],
          collapsed: (data.collapsed as string[] | null) ?? [],
          hidden: (data.hidden as string[] | null) ?? [],
        });
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Persistência debounced
  useEffect(() => {
    if (!loaded || !user?.id) return;
    const t = setTimeout(() => {
      void supabase.from("user_dashboard_preferences").upsert(
        {
          user_id: user.id,
          base_company_id: prefs.baseCompanyId,
          filters: prefs.filters as unknown as Record<string, unknown>,
          layout: prefs.layout as unknown as Record<string, unknown>,
          favorites: prefs.favorites,
          collapsed: prefs.collapsed,
          hidden: prefs.hidden,
        },
        { onConflict: "user_id" },
      );
    }, 500);
    return () => clearTimeout(t);
  }, [prefs, loaded, user?.id]);

  const update = useCallback((patch: Patch) => {
    setPrefs((p) => merge(p, patch));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPrefs((p) => ({
      ...p,
      favorites: p.favorites.includes(id)
        ? p.favorites.filter((x) => x !== id)
        : [...p.favorites, id],
    }));
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setPrefs((p) => ({
      ...p,
      collapsed: p.collapsed.includes(id)
        ? p.collapsed.filter((x) => x !== id)
        : [...p.collapsed, id],
    }));
  }, []);

  const reset = useCallback(() => setPrefs(DEFAULT_PREFERENCES), []);

  return {
    prefs,
    loaded,
    update,
    toggleFavorite,
    toggleCollapsed,
    reset,
  };
}
