import { Card, CardContent } from "@/components/ui/card";
import type { ComparisonSummary } from "../types/comparison.types";

const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  summary: ComparisonSummary;
}

export function ComparisonSummaryBar({ summary }: Props) {
  const items = [
    { label: "Total comparado", value: String(summary.totalCompared), tone: "text-foreground" },
    { label: "Melhor preço", value: String(summary.bestPriceCount), tone: "text-success" },
    { label: "Acima do mercado", value: String(summary.aboveMarketCount), tone: "text-destructive" },
    {
      label: "Competitividade média",
      value: `${summary.avgCompetitiveness}%`,
      tone:
        summary.avgCompetitiveness >= 80
          ? "text-success"
          : summary.avgCompetitiveness >= 60
            ? "text-warning"
            : "text-destructive",
    },
    { label: "Oportunidades", value: String(summary.opportunities), tone: "text-primary" },
    { label: "Diferenciais", value: String(summary.differentials), tone: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{i.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${i.tone}`}>{i.value}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="col-span-2 md:col-span-3 lg:col-span-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Maior oportunidade de redução</p>
            <p className="text-sm font-medium">
              {summary.biggestOpportunityLabel ?? "Nenhuma redução sugerida"}
            </p>
          </div>
          <p className="text-xl font-semibold tabular-nums text-warning">
            {fmtMoney(summary.biggestOpportunityValue)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
