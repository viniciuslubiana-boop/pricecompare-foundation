import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractionService } from "../services/extraction.service";
import type {
  ExtractedVehicle,
  ExtractionInput,
  ExtractionPreviewResult,
} from "../types/extraction.types";
import { useAuth } from "@/hooks/useAuth";

export function useExtraction() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<ExtractionPreviewResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: async (input: ExtractionInput) =>
      extractionService.preview(input),
    onSuccess: (data) => {
      setPreview(data);
      if (data.totals.total === 0) {
        toast.warning("Nenhum veículo identificado no conteúdo informado.");
      } else {
        toast.success(`${data.totals.total} linha(s) identificada(s).`);
      }
    },
    onError: (err: Error) => {
      toast.error("Falha ao processar extração", { description: err.message });
    },
  });

  const updateRow = useCallback((tempId: string, patch: Partial<ExtractedVehicle>) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = prev.rows.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r));
      return extractionService.revalidate(next);
    });
  }, []);

  const removeRow = useCallback((tempId: string) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = prev.rows.filter((r) => r.tempId !== tempId);
      return extractionService.revalidate(next);
    });
  }, []);

  const reset = useCallback(() => setPreview(null), []);

  const confirmMutation = useMutation({
    mutationFn: async (params: {
      competitorId: string;
      competitorName: string;
      competitorUrl: string | null;
    }) => {
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      if (!preview) throw new Error("Nenhum preview disponível.");
      return extractionService.confirm({
        rows: preview.rows,
        competitorId: params.competitorId,
        competitorName: params.competitorName,
        competitorUrl: params.competitorUrl,
        userId: user.id,
      });
    },
    onSuccess: (res) => {
      if (res.status === "completed") {
        toast.success(`${res.savedCount} veículo(s) importado(s) com sucesso.`);
      } else if (res.status === "partial") {
        toast.warning(
          `${res.savedCount} salvo(s); ${res.totals.total - res.savedCount} ignorado(s).`,
        );
      } else {
        toast.error("Nenhum veículo válido para importar.");
      }
      setPreview(null);
    },
    onError: (err: Error) => {
      toast.error("Erro ao salvar extração", { description: err.message });
    },
  });

  return {
    preview,
    runPreview: previewMutation.mutate,
    isProcessing: previewMutation.isPending,
    updateRow,
    removeRow,
    reset,
    confirm: confirmMutation.mutate,
    isConfirming: confirmMutation.isPending,
  };
}
