import { z } from "zod";

export const vehicleSchema = z.object({
  brand: z
    .string({ required_error: "Marca é obrigatória" })
    .trim()
    .min(1, "Marca é obrigatória")
    .max(80, "Máximo de 80 caracteres"),
  model: z
    .string({ required_error: "Modelo é obrigatório" })
    .trim()
    .min(1, "Modelo é obrigatório")
    .max(120, "Máximo de 120 caracteres"),
  year_model: z
    .string({ required_error: "Ano/Modelo é obrigatório" })
    .trim()
    .min(4, "Informe o Ano/Modelo (ex.: 2022/2023)")
    .max(20, "Máximo de 20 caracteres"),
  km: z
    .coerce
    .number({ invalid_type_error: "Informe um número válido" })
    .int("KM deve ser um número inteiro")
    .min(0, "KM não pode ser negativo")
    .max(9_999_999, "Valor de KM muito alto"),
  price: z
    .coerce
    .number({ invalid_type_error: "Informe um valor válido" })
    .min(0, "Valor não pode ser negativo")
    .max(99_999_999, "Valor muito alto"),
  supplier_name: z
    .string()
    .trim()
    .max(120, "Máximo de 120 caracteres")
    .optional()
    .or(z.literal("")),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
