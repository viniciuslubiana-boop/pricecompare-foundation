import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./base.repository";
import type { MyVehicle, MyVehicleInsert, MyVehicleUpdate } from "@/types/database.types";
import type { InventoryFilters } from "@/features/inventory/types/inventory.types";

class VehicleRepository extends BaseRepository<"my_vehicles"> {
  constructor() {
    super("my_vehicles");
  }

  async list(filters: InventoryFilters = {}): Promise<MyVehicle[]> {
    let query = supabase.from("my_vehicles").select("*").order("created_at", { ascending: false });

    if (filters.baseCompanyId) {
      query = query.eq("base_company_id", filters.baseCompanyId);
    }
    if (filters.brand && filters.brand !== "__all__") {
      query = query.eq("brand", filters.brand);
    }
    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`brand.ilike.${term},model.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async listBrands(baseCompanyId?: string | null): Promise<string[]> {
    let query = supabase.from("my_vehicles").select("brand").order("brand");
    if (baseCompanyId) query = query.eq("base_company_id", baseCompanyId);
    const { data, error } = await query;
    if (error) throw error;
    const set = new Set<string>();
    (data ?? []).forEach((row) => row.brand && set.add(row.brand));
    return Array.from(set);
  }

  async create(payload: MyVehicleInsert) {
    const { data, error } = await supabase.from("my_vehicles").insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, payload: MyVehicleUpdate) {
    const { data, error } = await supabase
      .from("my_vehicles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from("my_vehicles").delete().eq("id", id);
    if (error) throw error;
  }
}

export const vehicleRepository = new VehicleRepository();
