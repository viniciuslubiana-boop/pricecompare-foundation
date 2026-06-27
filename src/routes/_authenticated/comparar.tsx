import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SummaryCard } from "@/features/dashboard/widgets/SummaryCard";
import { RadarPanel } from "@/features/comparison/components/RadarPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitCompareArrows, Loader2, Play, Save } from "lucide-react";
import { useCompetitorsList } from "@/features/competitors/hooks/useCompetitors";
import { useComparison } from "@/features/comparison/hooks/useComparison";
import { ComparisonSummaryBar } from "@/features/comparison/components/ComparisonSummaryBar";
import { ComparisonFiltersBar } from "@/features/comparison/components/ComparisonFiltersBar";
import { ComparisonTable } from "@/features/comparison/components/ComparisonTable";
import { applyComparisonFilters } from "@/features/comparison/utils/comparison.filters";
import type { ComparisonFilters } from "@/features/comparison/types/comparison.types";

export const Route = createFileRoute("/_authenticated/comparar")({
  head: () => ({ meta: [{ title: "Comparar · PriceCompare" }] }),
  component: CompararPage,
});

function CompararPage() {
  const { data: competitors = [], isLoading } = useCompetitorsList({
    status: "active",
  });
  const [competitorId, setCompetitorId] = useState("");
  const [filters, setFilters] = useState<ComparisonFilters>({});
  const { result, run, isRunning, save, isSaving } = useComparison();

  const filteredRows = useMemo(
    () => (result ? applyComparisonFilters(result.rows, filters) : []),
    [result, filters],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comparar"
        description="Compare seu estoque com o de um concorrente. Cálculos centralizados no Comparison Engine."
        actions={
          <Button onClick={() => run(competitorId)} disabled={!competitorId || isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Comparar
          </Button>
        }
      />

      <SummaryCard
        title="Radar de Competitividade"
        description="Veículos do seu estoque com prioridade Alta ou Média frente a todo o mercado."
      >
        <RadarPanel />
      </SummaryCard>


      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Concorrente</Label>
            <Select value={competitorId} onValueChange={setCompetitorId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Carregando..." : "Selecione um concorrente"}
                />
              </SelectTrigger>
              <SelectContent>
                {competitors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <>
          <ComparisonSummaryBar summary={result.summary} />
          <ComparisonFiltersBar
            value={filters}
            onChange={setFilters}
            competitorOptions={result.marketCompetitors}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Exibindo {filteredRows.length} de {result.rows.length} linha(s).
            </p>
            <Button
              variant="outline"
              onClick={() => save()}
              disabled={isSaving || result.summary.totalMatches === 0}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar comparação
            </Button>
          </div>
          {filteredRows.length ? (
            <ComparisonTable rows={filteredRows} />
          ) : (
            <EmptyState
              icon={GitCompareArrows}
              title="Nenhuma linha após filtros"
              description="Ajuste os filtros para visualizar os resultados."
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={GitCompareArrows}
          title="Nenhuma comparação gerada"
          description="Selecione um concorrente ativo e clique em Comparar."
        />
      )}
    </div>
  );
}
