import { z } from "zod";

/** Schema de uma linha de extração pronta para salvar em competitor_vehicles. */
export const extractedVehicleSchema = z.object({
  brand: z.string().min(1, "Marca obrigatória"),
  model: z.string().min(1, "Modelo obrigatório"),
  year_model: z.string().min(1, "Ano/modelo obrigatório"),
  km: z.number().int().nonnegative().nullable(),
  price: z.number().positive("Preço deve ser maior que zero").nullable(),
  source_url: z.string().url().nullable().optional().or(z.literal("")),
  competitor_name: z.string().nullable().optional(),
});

export type ExtractedVehicleSchema = z.infer<typeof extractedVehicleSchema>;

/** Schema de entrada da extração (texto/HTML colado). */
export const extractionInputSchema = z.object({
  competitorId: z.string().uuid("Selecione um concorrente"),
  rawContent: z
    .string()
    .trim()
    .min(10, "Cole pelo menos um trecho de texto ou HTML"),
  inputType: z.enum(["text", "html"]).default("text"),
});

export type ExtractionInputSchema = z.infer<typeof extractionInputSchema>;
