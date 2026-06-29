import { z } from "zod";

export const fipeProviderSchema = z.enum(["parallelum", "commercial"]);

export const fipeQuoteQuerySchema = z.object({
  brand: z.string().min(1, "Marca obrigatória"),
  model: z.string().min(1, "Modelo obrigatório"),
  year_model: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  fuel: z.string().nullable().optional(),
  fipe_code: z.string().nullable().optional(),
});

export const fipeManualLinkSchema = z.object({
  vehicle_id: z.string().uuid(),
  fipe_code: z.string().min(3, "Informe o código FIPE"),
  year_model: z.number().int(),
  fuel: z.string().nullable().optional(),
});

export type FipeManualLinkInput = z.infer<typeof fipeManualLinkSchema>;
