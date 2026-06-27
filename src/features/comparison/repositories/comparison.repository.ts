import { supabase } from "@/integrations/supabase/client";
import { comparisonRepository } from "@/repositories/comparison.repository";
import type { CompetitorVehicle } from "@/types/database.types";

class ComparisonDataRepository {
  /** Lista veículos de um concorrente pelo nome (Sprint 008 — sem FK ainda). */
  async listCompetitorVehiclesByName(name: string): Promise<CompetitorVehicle[]> {
    const { data, error } = await supabase
      .from("competitor_vehicles")
      .select("*")
      .eq("competitor_name", name)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CompetitorVehicle[];
  }
}

export const comparisonDataRepository = new ComparisonDataRepository();
export { comparisonRepository };
