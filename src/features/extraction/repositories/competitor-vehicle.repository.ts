import { supabase } from "@/integrations/supabase/client";
import type { CompetitorVehicle, CompetitorVehicleInsert } from "@/types/database.types";

class CompetitorVehicleRepository {
  async bulkInsert(rows: CompetitorVehicleInsert[]): Promise<CompetitorVehicle[]> {
    if (!rows.length) return [];
    const { data, error } = await supabase.from("competitor_vehicles").insert(rows).select();
    if (error) throw error;
    return (data ?? []) as CompetitorVehicle[];
  }

  async listByCompetitor(competitorId: string): Promise<CompetitorVehicle[]> {
    const { data, error } = await supabase
      .from("competitor_vehicles")
      .select("*")
      .eq("competitor_id", competitorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CompetitorVehicle[];
  }
}

export const competitorVehicleRepository = new CompetitorVehicleRepository();
