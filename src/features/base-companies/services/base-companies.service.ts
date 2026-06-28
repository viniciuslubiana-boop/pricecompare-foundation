import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/features/admin/services/audit.service";
import type { BaseCompany, BaseCompanyInsert, BaseCompanyUpdate } from "../types";

export const baseCompaniesService = {
  async list(): Promise<BaseCompany[]> {
    const { data, error } = await supabase
      .from("base_companies")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async listActive(): Promise<BaseCompany[]> {
    const { data, error } = await supabase
      .from("base_companies")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: BaseCompanyInsert): Promise<BaseCompany> {
    const { data, error } = await supabase
      .from("base_companies")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    try {
      await auditService.log({
        action: "base_company_created",
        module: "base_companies",
        recordId: data.id,
        newData: data as unknown as Record<string, unknown>,
      });
    } catch {
      /* noop */
    }
    return data;
  },

  async update(id: string, payload: BaseCompanyUpdate): Promise<BaseCompany> {
    const { data, error } = await supabase
      .from("base_companies")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    try {
      await auditService.log({
        action: "base_company_updated",
        module: "base_companies",
        recordId: id,
        newData: data as unknown as Record<string, unknown>,
      });
    } catch {
      /* noop */
    }
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("base_companies").delete().eq("id", id);
    if (error) throw error;
    try {
      await auditService.log({
        action: "base_company_deleted",
        module: "base_companies",
        recordId: id,
      });
    } catch {
      /* noop */
    }
  },
};
