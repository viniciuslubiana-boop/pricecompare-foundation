import type { Competitor, CompetitorInsert, CompetitorUpdate } from "@/types/database.types";

export type { Competitor, CompetitorInsert, CompetitorUpdate };

export type CompetitorStatus = "active" | "inactive";

export interface CompetitorFilters {
  search?: string;
  status?: CompetitorStatus | "all";
}
