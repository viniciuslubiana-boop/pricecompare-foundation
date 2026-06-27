import { Card, CardContent } from "@/components/ui/card";
import type { ComparisonSummary } from "../types/comparison.types";

const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  summary: ComparisonSummary;
}

export function ComparisonSummaryBar({ summary }: Props) {
  const items = [
    { label: "Matches", value: summary.totalMatches, tone: "text-foreground" },
    { label: "Você mais barato", value: summary.meCheaper, tone: "text-success" },
    {
      label: "Concorrente mais barato",
      value: summary.competitorCheaper,
      tone: "text-destructive",
    },
    { label: "Empates", value: summary.ties, tone: "text-muted-foreground" },
    { label: "Oportunidades", value: summary.opportunities, tone: "text-primary" },
    { label: "Diferenciais", value: summary.differentials, tone: "text-foreground" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{i.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${i.tone}`}>
              {i.value}
            </p>
          </CardContent>
        </Card>
      ))}
      <Card className="col-span-2 md:col-span-3 lg:col-span-6">
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm text-muted-foreground">
            Soma das diferenças onde você está mais barato
          </p>
          <p className="text-xl font-semibold tabular-nums text-success">
            {fmtMoney(summary.totalSavings)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
