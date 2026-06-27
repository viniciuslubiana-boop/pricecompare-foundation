import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CompetitorRunDetail } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: CompetitorRunDetail[];
}

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function MarketUpdateDetailsDialog({ open, onOpenChange, details }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Atualização</DialogTitle>
          <DialogDescription>
            Resultado por concorrente processado nesta execução.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concorrente</TableHead>
                <TableHead className="text-right">Veículos</TableHead>
                <TableHead className="text-right">Comparações</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((d) => (
                <TableRow key={d.competitorId}>
                  <TableCell>
                    <div className="font-medium">{d.competitorName}</div>
                    {d.error ? (
                      <div className="text-xs text-red-500">{d.error}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {d.competitorUrl}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{d.vehiclesFound}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.comparisonsCreated}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMs(d.durationMs)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={d.status === "completed" ? "default" : "destructive"}
                    >
                      {d.status === "completed" ? "OK" : "Erro"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!details.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Nenhum detalhe disponível.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
