import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { analyticsKeys } from "@/features/analytics";
import { operationsKeys } from "@/features/operations";
import { marketUpdateService } from "../services/market-update.service";
import type { MarketUpdateProgress, MarketUpdateResult } from "../types";

const initialProgress: MarketUpdateProgress = {
  phase: "idle",
  currentCompetitorIndex: 0,
  totalCompetitors: 0,
  currentCompetitorName: null,
  currentPage: 0,
  totalPages: 0,
  vehiclesFoundCurrent: 0,
  elapsedMs: 0,
  percent: 0,
};

export function useMarketUpdate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRunning, setRunning] = useState(false);
  const [progress, setProgress] = useState<MarketUpdateProgress>(initialProgress);
  const [result, setResult] = useState<MarketUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    if (!user?.id) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    if (isRunning) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setProgress({ ...initialProgress, phase: "loading-competitors" });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await marketUpdateService.run({
        userId: user.id,
        onProgress: setProgress,
        signal: controller.signal,
      });
      setResult(res);
      // ETAPAS 4 e 5 — Analytics + Dashboard atualizam por invalidação
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      queryClient.invalidateQueries({ queryKey: operationsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["market-update", "history"] });
      if (res.status === "completed") toast.success("Mercado atualizado com sucesso.");
      else if (res.status === "partial") toast.warning("Atualização parcial do mercado.");
      else toast.error("Falha ao atualizar mercado.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setProgress((p) => ({ ...p, phase: "error" }));
      toast.error(msg);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [user?.id, isRunning, queryClient]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setProgress(initialProgress);
    setResult(null);
    setError(null);
  }, []);

  return { start, cancel, reset, isRunning, progress, result, error };
}
