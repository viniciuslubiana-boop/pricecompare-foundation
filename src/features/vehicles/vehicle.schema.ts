// Reexport temporário para retrocompatibilidade.
// O domínio oficial agora é `@/features/inventory`.
export {
  inventoryVehicleSchema as vehicleSchema,
  type InventoryFormValues as VehicleFormValues,
} from "@/features/inventory/schemas/inventory.schema";
