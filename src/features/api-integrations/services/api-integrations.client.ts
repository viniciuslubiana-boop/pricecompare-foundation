/**
 * Cliente Supabase para leitura segura de integrações (sem token).
 * Escrita acontece via server functions.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ApiIntegrationPublic, ApiIntegrationLog } from "../types";

export const apiIntegrationsClient = {
  async list(): Promise<ApiIntegrationPublic[]> {
    const { data, error } = await supabase
      .from("api_integrations_public" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ApiIntegrationPublic[];
  },

  async listLogs(integrationId?: string): Promise<ApiIntegrationLog[]> {
    let q = supabase
      .from("api_integration_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100);
    if (integrationId) q = q.eq("integration_id", integrationId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as ApiIntegrationLog[];
  },
};
