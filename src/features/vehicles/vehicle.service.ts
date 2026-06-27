import { vehicleRepository } from "@/repositories/vehicle.repository";
import type { VehicleFilters, VehicleInsert, VehicleUpdate } from "./vehicle.types";
import type { VehicleFormValues } from "./vehicle.schema";

export const vehicleService = {
  list: (filters: VehicleFilters) => vehicleRepository.list(filters),
  listBrands: () => vehicleRepository.listBrands(),

  create: (values: VehicleFormValues, userId: string) => {
    const payload: VehicleInsert = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      year_model: values.year_model.trim(),
      km: values.km,
      price: values.price,
      supplier_name: values.supplier_name?.trim() || null,
      source: "manual",
      created_by: userId,
    };
    return vehicleRepository.create(payload);
  },

  update: (id: string, values: VehicleFormValues) => {
    const payload: VehicleUpdate = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      year_model: values.year_model.trim(),
      km: values.km,
      price: values.price,
      supplier_name: values.supplier_name?.trim() || null,
    };
    return vehicleRepository.update(id, payload);
  },

  remove: (id: string) => vehicleRepository.delete(id),
};
