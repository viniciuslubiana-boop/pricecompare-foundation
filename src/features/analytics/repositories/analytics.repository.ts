import { supabase } from "@/integrations/supabase/client";
import type { Comparison, Competitor, CompetitorVehicle, MyVehicle } from "@/types/database.types";

class AnalyticsRepository {
  async listMyVehicles(): Promise<MyVehicle[]> {
    const { data, error } = await supabase
      .from("my_vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MyVehicle[];
  }

  async listCompetitorVehicles(): Promise<CompetitorVehicle[]> {
    const { data, error } = await supabase
      .from("competitor_vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CompetitorVehicle[];
  }

  async listCompetitors(): Promise<Competitor[]> {
    const { data, error } = await supabase
      .from("competitors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Competitor[];
  }

  async listComparisons(): Promise<Comparison[]> {
    const { data, error } = await supabase
      .from("comparisons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Comparison[];
  }
}

export const analyticsRepository = new AnalyticsRepository();
