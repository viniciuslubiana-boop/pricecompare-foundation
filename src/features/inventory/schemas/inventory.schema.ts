import { z } from "zod";
import {
  normalizeBrand,
  normalizeModel,
  normalizeYearModel,
  normalizeKm,
  normalizePrice,
  normalizeSupplier,
} from "../utils/inventory-normalization";

/**
 * Schema do formulário de veículo.
 * Os campos numéricos aceitam string para suportar formato brasileiro
 * (ex.: "89.900,00" / "120.000") e são convertidos via normalização.
 */
export const inventoryVehicleSchema = z.object({
  brand: z
    .string({ required_error: "Marca é obrigatória" })
    .transform((v) => normalizeBrand(v))
    .pipe(z.string().min(1, "Marca é obrigatória").max(80, "Máximo de 80 caracteres")),
  model: z
    .string({ required_error: "Modelo é obrigatório" })
    .transform((v) => normalizeModel(v))
    .pipe(z.string().min(1, "Modelo é obrigatório").max(120, "Máximo de 120 caracteres")),
  year_model: z
    .string({ required_error: "Ano/Modelo é obrigatório" })
    .transform((v) => normalizeYearModel(v))
    .pipe(z.string().min(4, "Informe o Ano/Modelo (ex.: 2022/2023)").max(20)),
  km: z
    .union([z.string(), z.number()])
    .transform((v) => normalizeKm(v))
    .pipe(
      z
        .number()
        .int("KM deve ser um número inteiro")
        .min(0, "KM não pode ser negativo")
        .max(9_999_999, "Valor de KM muito alto"),
    ),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => normalizePrice(v))
    .pipe(z.number().min(0, "Valor não pode ser negativo").max(99_999_999, "Valor muito alto")),
  supplier_name: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => normalizeSupplier(v ?? null)),
});

export type InventoryFormInput = z.input<typeof inventoryVehicleSchema>;
export type InventoryFormValues = z.output<typeof inventoryVehicleSchema>;
