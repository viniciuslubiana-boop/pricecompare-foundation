import type { MyVehicle, MyVehicleInsert, MyVehicleUpdate } from "@/types/database.types";

export type Vehicle = MyVehicle;
export type VehicleInsert = MyVehicleInsert;
export type VehicleUpdate = MyVehicleUpdate;

export interface InventoryFilters {
  search?: string;
  brand?: string;
  /** Filtra estoque por Empresa Base. Obrigatório no UI; pode ser undefined em consultas globais. */
  baseCompanyId?: string | null;
}
