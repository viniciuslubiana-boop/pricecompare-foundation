import type { MyVehicle, MyVehicleInsert, MyVehicleUpdate } from "@/types/database.types";

export type Vehicle = MyVehicle;
export type VehicleInsert = MyVehicleInsert;
export type VehicleUpdate = MyVehicleUpdate;

export interface VehicleFilters {
  search?: string;
  brand?: string;
}
