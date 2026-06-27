import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { comparisonService } from "../services/comparison.service";
import type { ComparisonResult } from "../types/comparison.types";

export function useComparison() {
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const runMutation = useMutation({
    mutationFn: (competitorId: string) => comparisonService.run(competitorId),
    onSuccess: (data) => {
      setResult(data);
      const { summary } = data;
      toast.success(
        `Comparação gerada: ${summary.totalMatches} matches · ${summary.opportunities} oportunidades · ${summary.differentials} diferenciais`,
      );
    },
    onError: (err: Error) => {
      toast.error("Erro ao gerar comparação", { description: err.message });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error("Gere uma comparação antes de salvar.");
      return comparisonService.save(result);
    },
    onSuccess: (count) => {
      toast.success(`${count} comparação(ões) salva(s).`);
    },
    onError: (err: Error) => {
      toast.error("Erro ao salvar comparação", { description: err.message });
    },
  });

  return {
    result,
    run: runMutation.mutate,
    isRunning: runMutation.isPending,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    reset: () => setResult(null),
  };
}
