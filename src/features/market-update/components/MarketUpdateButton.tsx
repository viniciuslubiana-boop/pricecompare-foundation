import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useMarketUpdate } from "../hooks/useMarketUpdate";
import { MarketUpdateDetailsDialog } from "./MarketUpdateDetailsDialog";

function formatStopwatch(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `00:${m}:${s}`;
}

export function MarketUpdateButton({
  size = "default",
  className,
}: {
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { start, isRunning, progress, result, error, reset } = useMarketUpdate();
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // refresh the stopwatch while running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [isRunning]);

  const handleClick = async () => {
    setOpen(true);
    reset();
    await start();
  };

  const handleClose = (next: boolean) => {
    if (isRunning) return; // não fecha durante execução
    setOpen(next);
    if (!next) reset();
  };

  const elapsed = progress.elapsedMs + (isRunning ? tick * 0 : 0);

  return (
    <>
      <Button
        onClick={handleClick}
        size={size}
        className={className}
        disabled={isRunning}
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span>Atualizar Mercado</span>
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e) => isRunning && e.preventDefault()}
          onEscapeKeyDown={(e) => isRunning && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result ? (
                result.status === "completed" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Mercado atualizado
                  </>
                ) : result.status === "partial" ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Atualização parcial
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" /> Falha na atualização
                  </>
                )
              ) : error ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" /> Não foi possível atualizar
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" /> Atualizando Mercado...
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {result
                ? result.message
                : error
                  ? error
                  : "Verificando concorrentes, extraindo veículos e gerando comparações."}
            </DialogDescription>
          </DialogHeader>

          {/* Progresso enquanto roda */}
          {!result && !error && (
            <div className="space-y-4">
              <Progress value={progress.percent} className="h-2" />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Concorrente</dt>
                  <dd className="font-medium truncate">
                    {progress.currentCompetitorName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Página</dt>
                  <dd className="font-medium tabular-nums">
                    {progress.currentPage} de {progress.totalPages || 1}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Veículos encontrados</dt>
                  <dd className="font-medium tabular-nums">{progress.vehiclesFoundCurrent}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tempo</dt>
                  <dd className="font-medium tabular-nums">{formatStopwatch(elapsed)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Etapa</dt>
                  <dd className="font-medium tabular-nums">
                    {progress.currentCompetitorIndex} de {progress.totalCompetitors} concorrentes
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Resumo final */}
          {result && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Concorrentes processados" value={result.competitorsProcessed} />
              <Metric label="Com erro" value={result.competitorsFailed} tone="danger" />
              <Metric label="Veículos encontrados" value={result.vehiclesFound} />
              <Metric label="Veículos iguais" value={result.matches} />
              <Metric label="Oportunidades" value={result.opportunities} tone="warning" />
              <Metric label="Diferenciais" value={result.differentials} tone="success" />
              <Metric
                label="Tempo total"
                value={formatStopwatch(result.durationMs)}
                className="col-span-2"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {result && (
              <Button variant="outline" onClick={() => setDetailsOpen(true)}>
                Ver Detalhes
              </Button>
            )}
            <Button
              variant={result || error ? "default" : "ghost"}
              onClick={() => handleClose(false)}
              disabled={isRunning}
            >
              {isRunning ? "Aguarde..." : "Fechar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarketUpdateDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        details={result?.details ?? []}
      />
    </>
  );
}

function Metric({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warning" | "danger";
  className?: string;
}) {
  const color =
    tone === "success"
      ? "text-emerald-500"
      : tone === "warning"
        ? "text-amber-500"
        : tone === "danger"
          ? "text-red-500"
          : "";
  return (
    <div className={`rounded-md border p-3 ${className ?? ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
