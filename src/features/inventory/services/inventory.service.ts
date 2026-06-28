import { vehicleRepository } from "@/repositories/vehicle.repository";
import type { InventoryFilters, VehicleInsert, VehicleUpdate } from "../types/inventory.types";
import type { InventoryFormValues } from "../schemas/inventory.schema";

/**
 * Inventory Service — ponto único de entrada para qualquer operação sobre o estoque.
 * Toda criação/atualização exige `baseCompanyId` (Empresa Base).
 */
export const inventoryService = {
  list: (filters: InventoryFilters) => vehicleRepository.list(filters),
  listBrands: (baseCompanyId?: string | null) => vehicleRepository.listBrands(baseCompanyId),

  create: (
    values: InventoryFormValues,
    userId: string,
    baseCompanyId: string,
    source: string = "manual",
  ) => {
    if (!baseCompanyId) throw new Error("Selecione uma Empresa Base.");
    const payload: VehicleInsert = {
      brand: values.brand,
      model: values.model,
      year_model: values.year_model,
      km: values.km,
      price: values.price,
      supplier_name: values.supplier_name,
      source,
      created_by: userId,
      base_company_id: baseCompanyId,
    };
    return vehicleRepository.create(payload);
  },

  update: (id: string, values: InventoryFormValues, baseCompanyId?: string) => {
    const payload: VehicleUpdate = {
      brand: values.brand,
      model: values.model,
      year_model: values.year_model,
      km: values.km,
      price: values.price,
      supplier_name: values.supplier_name,
    };
    if (baseCompanyId) payload.base_company_id = baseCompanyId;
    return vehicleRepository.update(id, payload);
  },

  remove: (id: string) => vehicleRepository.delete(id),
};
