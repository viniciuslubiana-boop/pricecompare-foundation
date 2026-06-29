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
