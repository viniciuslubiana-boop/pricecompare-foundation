import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Centraliza a sincronização do Dashboard Executivo (e módulos relacionados)
 * com o banco via Supabase Realtime. Toda mutação em qualquer um dos
 * Engines do PCM dispara invalidação dos caches do TanStack Query, fazendo
 * com que widgets, KPIs e consultas se atualizem sozinhos — sem refresh.
 *
 * Aderente a docs/PCM_MASTER_ARCHITECTURE.md: o Dashboard nunca calcula,
 * apenas consome os Engines (Inventory, Competitor, Extraction, Comparison,
 * Analytics). Aqui apenas observamos as tabelas raiz para invalidar.
 */

type TableKeys = Record<string, ReadonlyArray<ReadonlyArray<unknown>>>;

// Mapeia tabela -> queryKeys que dependem dela.
const TABLE_TO_KEYS: TableKeys = {
  my_vehicles: [
    ["analytics"],
    ["dashboard"],
    ["inventory"],
    ["comparison"],
    ["global-search"],
    ["vehicle-360"],
    ["market-update", "history"],
    ["radar"],
    ["strategy"],
    ["operations"],
  ],
  competitors: [
    ["analytics"],
    ["dashboard"],
    ["competitors"],
    ["competitor-imports"],
    ["comparison"],
    ["operations"],
  ],
  competitor_vehicles: [
    ["analytics"],
    ["dashboard"],
    ["competitor-vehicles"],
    ["comparison"],
    ["global-search"],
    ["vehicle-360"],
    ["market-update", "history"],
    ["radar"],
    ["strategy"],
    ["operations"],
  ],
  comparisons: [
    ["analytics"],
    ["dashboard"],
    ["comparison"],
    ["radar"],
    ["strategy"],
    ["operations"],
  ],
  market_changes: [
    ["analytics"],
    ["dashboard"],
    ["market-changes"],
    ["market-update"],
    ["operations"],
  ],
  market_update_runs: [
    ["analytics"],
    ["dashboard"],
    ["market-update"],
    ["operations"],
  ],
  import_logs: [
    ["analytics"],
    ["dashboard"],
    ["imports"],
    ["competitor-imports"],
    ["inventory"],
    ["competitor-vehicles"],
    ["operations"],
  ],
  base_companies: [
    ["analytics"],
    ["dashboard"],
    ["base-companies"],
    ["inventory"],
    ["comparison"],
    ["global-search"],
  ],
};

export function useRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const tables = Object.keys(TABLE_TO_KEYS);
    const channel = supabase.channel("pcm-dashboard-sync");

    for (const table of tables) {
      channel.on(
        // @ts-expect-error - tipos do supabase-js para postgres_changes
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          const keys = TABLE_TO_KEYS[table];
          for (const key of keys) {
            qc.invalidateQueries({ queryKey: key as readonly unknown[] });
          }
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
