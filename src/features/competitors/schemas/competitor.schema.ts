import { z } from "zod";
import {
  isValidHttpUrl,
  normalizeCompetitorName,
  normalizeCompetitorNotes,
  normalizeCompetitorUrl,
} from "../utils/competitor-normalization";

export const competitorSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .transform((v) => normalizeCompetitorName(v))
    .pipe(z.string().min(1, "Nome é obrigatório").max(120, "Máximo de 120 caracteres")),
  url: z
    .string({ required_error: "URL é obrigatória" })
    .transform((v) => normalizeCompetitorUrl(v))
    .pipe(
      z
        .string()
        .min(1, "URL é obrigatória")
        .max(500, "Máximo de 500 caracteres")
        .refine(isValidHttpUrl, "Informe uma URL válida (http ou https)"),
    ),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => normalizeCompetitorNotes(v ?? null)),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type CompetitorFormInput = z.input<typeof competitorSchema>;
export type CompetitorFormValues = z.output<typeof competitorSchema>;
