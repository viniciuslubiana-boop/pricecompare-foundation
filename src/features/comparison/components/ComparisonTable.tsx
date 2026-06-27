import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CommercialStatus,
  ComparisonRow,
  RecommendedActionKind,
  ResultKind,
} from "../types/comparison.types";

const fmtMoney = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const KIND_LABEL: Record<ResultKind, string> = {
  match: "Match",
  opportunity: "Oportunidade",
  differential: "Diferencial",
};
const KIND_TONE: Record<ResultKind, string> = {
  match: "bg-primary/10 text-primary border-primary/30",
  opportunity: "bg-warning/15 text-warning-foreground border-warning/40",
  differential: "bg-muted text-muted-foreground border-border",
};

const STATUS_META: Record<CommercialStatus, { label: string; tone: string; dot: string }> = {
  best_price: {
    label: "Melhor preço",
    tone: "bg-success/15 text-success border-success/30",
    dot: "🟢",
  },
  very_competitive: {
    label: "Muito competitivo",
    tone: "bg-success/10 text-success border-success/30",
    dot: "🟢",
  },
  competitive: {
    label: "Competitivo",
    tone: "bg-warning/15 text-warning-foreground border-warning/40",
    dot: "🟡",
  },
  above_market: {
    label: "Acima do mercado",
    tone: "bg-orange-500/15 text-orange-600 border-orange-500/40 dark:text-orange-400",
    dot: "🟠",
  },
  far_above_market: {
    label: "Muito acima do mercado",
    tone: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "🔴",
  },
  insufficient_data: {
    label: "Sem dados",
    tone: "bg-muted text-muted-foreground border-border",
    dot: "⚪",
  },
};

const ACTION_TONE: Record<RecommendedActionKind, string> = {
  keep: "text-foreground",
  reduce: "text-destructive",
  follow_market: "text-muted-foreground",
  excellent_opportunity: "text-success",
  insufficient_data: "text-muted-foreground",
};

function competitivenessTone(score: number, hasMarket: boolean): string {
  if (!hasMarket) return "text-muted-foreground";
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

interface Props {
  rows: ComparisonRow[];
}

export function ComparisonTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Marca</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead className="w-[90px]">Ano</TableHead>
            <TableHead className="w-[120px]">Seu preço</TableHead>
            <TableHead className="w-[120px]">Preço médio</TableHead>
            <TableHead className="w-[110px]">Diferença</TableHead>
            <TableHead className="w-[100px]">Posição</TableHead>
            <TableHead className="w-[120px]">Competitividade</TableHead>
            <TableHead className="w-[180px]">Status</TableHead>
            <TableHead className="w-[220px]">Ação recomendada</TableHead>
            <TableHead className="w-[110px]">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const ref = r.myVehicle ?? r.competitorVehicle;
            const m = r.market;
            const statusMeta = STATUS_META[m.status];
            const hasMarket = m.competitorCount > 0;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{ref?.brand ?? "—"}</TableCell>
                <TableCell>{ref?.model ?? "—"}</TableCell>
                <TableCell>{ref?.year_model ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{fmtMoney(r.myVehicle?.price ?? null)}</TableCell>
                <TableCell className="tabular-nums">{fmtMoney(m.avg)}</TableCell>
                <TableCell
                  className={cn(
                    "tabular-nums",
                    m.diffFromAvg != null && m.diffFromAvg < 0 && "text-success",
                    m.diffFromAvg != null && m.diffFromAvg > 0 && "text-destructive",
                  )}
                >
                  {m.diffFromAvg == null ? "—" : fmtMoney(m.diffFromAvg)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {m.rankPosition == null ? "—" : `${m.rankPosition} / ${m.competitorCount + 1}`}
                </TableCell>
                <TableCell
                  className={cn("font-semibold tabular-nums", competitivenessTone(m.competitiveness, hasMarket))}
                >
                  {hasMarket ? `${m.competitiveness}%` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", statusMeta.tone)}>
                    <span className="mr-1">{statusMeta.dot}</span>
                    {statusMeta.label}
                  </Badge>
                </TableCell>
                <TableCell className={cn("text-xs font-medium", ACTION_TONE[m.action.kind])}>
                  {m.action.label}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", KIND_TONE[r.kind])}>
                    {KIND_LABEL[r.kind]}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
