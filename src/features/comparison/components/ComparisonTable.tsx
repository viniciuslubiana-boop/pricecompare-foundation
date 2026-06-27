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
  ComparisonRow,
  ResultKind,
  WinnerKind,
} from "../types/comparison.types";

const fmtMoney = (v: number | null | undefined) =>
  v == null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

const WINNER_LABEL: Record<WinnerKind, string> = {
  me: "Você",
  competitor: "Concorrente",
  tie: "Empate",
  unmatched: "—",
};
const WINNER_TONE: Record<WinnerKind, string> = {
  me: "bg-success/15 text-success border-success/30",
  competitor: "bg-destructive/15 text-destructive border-destructive/30",
  tie: "bg-muted text-muted-foreground border-border",
  unmatched: "bg-muted text-muted-foreground border-border",
};

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
            <TableHead className="w-[100px]">Ano</TableHead>
            <TableHead className="w-[130px]">Seu preço</TableHead>
            <TableHead className="w-[150px]">Preço concorrente</TableHead>
            <TableHead className="w-[120px]">Diferença</TableHead>
            <TableHead className="w-[90px]">Score</TableHead>
            <TableHead className="w-[140px]">Resultado</TableHead>
            <TableHead className="w-[130px]">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const ref = r.myVehicle ?? r.competitorVehicle;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{ref?.brand ?? "—"}</TableCell>
                <TableCell>{ref?.model ?? "—"}</TableCell>
                <TableCell>{ref?.year_model ?? "—"}</TableCell>
                <TableCell className="tabular-nums">
                  {fmtMoney(r.myVehicle?.price ?? null)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {fmtMoney(r.competitorVehicle?.price ?? null)}
                </TableCell>
                <TableCell
                  className={cn(
                    "tabular-nums",
                    r.priceDiff && r.priceDiff > 0 && "text-success",
                    r.priceDiff && r.priceDiff < 0 && "text-destructive",
                  )}
                >
                  {r.priceDiff == null ? "—" : fmtMoney(r.priceDiff)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {r.kind === "match" ? `${r.score.total}%` : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", WINNER_TONE[r.winner])}
                  >
                    {WINNER_LABEL[r.winner]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", KIND_TONE[r.kind])}
                  >
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
