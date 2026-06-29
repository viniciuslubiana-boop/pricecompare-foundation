export type VehicleType = "carro" | "moto";

export interface VehicleMasterCatalogRow {
  id: string;
  vehicle_type: VehicleType;
  brand: string;
  canonical_model: string;
  canonical_version: string | null;
  displacement: string | null;
  fuel: string | null;
  transmission: string | null;
  start_year: number | null;
  end_year: number | null;
  active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type VehicleMasterCatalogInput = Omit<
  VehicleMasterCatalogRow,
  "id" | "created_at" | "updated_at" | "created_by"
>;

export interface VehicleAliasRow {
  id: string;
  brand: string;
  alias: string;
  canonical: string;
  notes: string | null;
  master_catalog_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleAliasInput {
  brand: string;
  alias: string;
  canonical: string;
  master_catalog_id: string | null;
  notes?: string | null;
}

export interface CoverageReport {
  totalVehicles: number;
  resolvedVehicles: number;
  unresolvedVehicles: number;
  totalAliases: number;
  orphanAliases: number;
  duplicatedModels: number;
}

export interface AliasSuggestion {
  brand: string;
  alias: string;          // the raw model string found in stock/competitors
  canonical: string;      // the canonical model from the catalog
  master_catalog_id: string;
  occurrences: number;
  source: "my_vehicles" | "competitor_vehicles" | "both";
}
