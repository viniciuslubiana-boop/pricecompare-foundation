import { supabase } from "@/integrations/supabase/client";
import type { CompetitorVehicle, CompetitorVehicleInsert } from "@/types/database.types";

class CompetitorVehicleRepository {
  async bulkInsert(rows: CompetitorVehicleInsert[]): Promise<CompetitorVehicle[]> {
    if (!rows.length) return [];
    const { data, error } = await supabase.from("competitor_vehicles").insert(rows).select();
    if (error) throw error;
    return (data ?? []) as CompetitorVehicle[];
  }
}

export const competitorVehicleRepository = new CompetitorVehicleRepository();
