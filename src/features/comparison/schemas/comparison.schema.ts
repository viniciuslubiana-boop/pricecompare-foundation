import { z } from "zod";

export const runComparisonSchema = z.object({
  competitorId: z.string().uuid("Selecione um concorrente"),
});

export type RunComparisonInput = z.infer<typeof runComparisonSchema>;
