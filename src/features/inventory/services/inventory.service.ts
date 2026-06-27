import { vehicleRepository } from "@/repositories/vehicle.repository";
import type {
  InventoryFilters,
  VehicleInsert,
  VehicleUpdate,
} from "../types/inventory.types";
import type { InventoryFormValues } from "../schemas/inventory.schema";

/**
 * Inventory Service — ponto único de entrada para qualquer operação
 * sobre o estoque. Toda nova origem (CSV, Excel, smart paste, IA)
 * deve passar por aqui para garantir as mesmas regras.
 */
export const inventoryService = {
  list: (filters: InventoryFilters) => vehicleRepository.list(filters),
  listBrands: () => vehicleRepository.listBrands(),

  create: (values: InventoryFormValues, userId: string, source: string = "manual") => {
    const payload: VehicleInsert = {
      brand: values.brand,
      model: values.model,
      year_model: values.year_model,
      km: values.km,
      price: values.price,
      supplier_name: values.supplier_name,
      source,
      created_by: userId,
    };
    return vehicleRepository.create(payload);
  },

  update: (id: string, values: InventoryFormValues) => {
    const payload: VehicleUpdate = {
      brand: values.brand,
      model: values.model,
      year_model: values.year_model,
      km: values.km,
      price: values.price,
      supplier_name: values.supplier_name,
    };
    return vehicleRepository.update(id, payload);
  },

  remove: (id: string) => vehicleRepository.delete(id),
};
