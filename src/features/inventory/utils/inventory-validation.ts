import { inventoryVehicleSchema, type InventoryFormInput } from "../schemas/inventory.schema";

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

/**
 * Validação programática (fora do React Hook Form) — útil para
 * importações em lote (CSV/Excel/IA) na próxima sprint.
 */
export function validateVehicleInput(input: InventoryFormInput): ValidationResult {
  const result = inventoryVehicleSchema.safeParse(input);
  if (result.success) return { ok: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "_";
    if (!errors[path]) errors[path] = issue.message;
  }
  return { ok: false, errors };
}
