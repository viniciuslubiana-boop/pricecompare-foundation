// Reexport temporário — o hook oficial agora é `useInventory*` em `@/features/inventory/hooks/useInventory`.
export {
  useInventoryList as useMyVehicles,
  useInventoryBrands as useVehicleBrands,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/features/inventory/hooks/useInventory";
