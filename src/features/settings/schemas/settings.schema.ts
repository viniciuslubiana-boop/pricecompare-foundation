import { z } from "zod";

export const generalSchema = z.object({
  companyName: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(40).default(""),
  currency: z.literal("BRL").default("BRL"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export const comparisonSchema = z.object({
  minCompatibility: z.coerce.number().min(0).max(100),
  yearTolerance: z.coerce.number().int().min(0).max(10),
  kmTolerance: z.coerce.number().min(0).max(500000),
  priceTolerance: z.coerce.number().min(0).max(100),
  sameYearOnly: z.boolean(),
  considerVersion: z.boolean(),
});

export const marketSchema = z.object({
  defaultRadiusKm: z.coerce.number().min(1).max(1000),
  sources: z.array(z.enum(["site", "olx", "webmotors", "mobiauto", "icarros"])).min(1),
  frequency: z.enum(["manual", "daily", "weekly"]),
});

export const importsSchema = z.object({
  duplicateStrategy: z.enum(["ignore", "import", "update"]),
  csvDelimiter: z.enum([",", ";", "auto"]),
  trimWhitespace: z.boolean(),
});

export const reportsSchema = z.object({
  showLogo: z.boolean(),
  showDateTime: z.boolean(),
  showCompetitors: z.boolean(),
  showPriceHistory: z.boolean(),
  showListingLinks: z.boolean(),
});

export const settingsBundleSchema = z.object({
  general: generalSchema,
  comparison: comparisonSchema,
  market: marketSchema,
  imports: importsSchema,
  reports: reportsSchema,
});

export type GeneralFormValues = z.infer<typeof generalSchema>;
export type ComparisonFormValues = z.infer<typeof comparisonSchema>;
export type MarketFormValues = z.infer<typeof marketSchema>;
export type ImportsFormValues = z.infer<typeof importsSchema>;
export type ReportsFormValues = z.infer<typeof reportsSchema>;
