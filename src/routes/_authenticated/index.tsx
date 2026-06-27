import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ErrorState } from "@/components/ErrorState";
import {
  GitCompareArrows,
  Package,
  Plus,
  Radar,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";
import {
  useDashboard,
  MetricCard,
  SummaryCard,
  InsightCard,
  RankingCard,
  OpportunityCard,
  RankingBarChart,
  PriceDistributionChart,
  ComparisonStatusChart,
} from "@/features/dashboard";
import { MarketUpdateButton } from "@/features/market-update";
import { RadarPanel } from "@/features/comparison/components/RadarPanel";
import { StrategyPanel } from "@/features/comparison/components/StrategyPanel";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · PriceCompare" },
      { name: "description", content: "Centro executivo de inteligência do PriceCompare." },
    ],
  }),
  component: DashboardPage,
});

const fmtMoney = (v: number | null | undefined) =>
  typeof v !== "number"
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtPercent = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)}%`);

function CompetitivenessTone(level: "high" | "medium" | "low" | "unknown") {
  if (level === "high") return { tone: "success" as const, label: "Alta" };
  if (level === "medium") return { tone: "warning" as const, label: "Média" };
  if (level === "low") return { tone: "danger" as const, label: "Baixa" };
  return { tone: "default" as const, label: "—" };
}

function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard Executivo" description="Carregando indicadores..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Dashboard Executivo" />
        <ErrorState
          title="Falha ao carregar o dashboard"
          description={(error as Error | undefined)?.message ?? "Tente novamente."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { summary, comparison, market, distribution, competitiveness, insights, competitors } =
    data;
  const ctone = CompetitivenessTone(competitiveness.level);

  return (
    <div>
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada do mercado, do estoque e da concorrência."
        actions={
          <div className="flex gap-2">
            <MarketUpdateButton />
            <Button asChild variant="outline">
              <Link to="/comparar">
                <Plus className="h-4 w-4" /> Nova comparação
              </Link>
            </Button>
          </div>
        }
      />

      {/* Cards principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Competitividade"
          value={fmtPercent(competitiveness.percent)}
          hint={ctone.label}
          tone={ctone.tone}
          icon={<Trophy className="h-5 w-5" />}
        />
        <MetricCard
          label="Você mais barato"
          value={summary.differentials}
          hint={fmtMoney(comparison.totalSavings)}
          tone="success"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <MetricCard
          label="Concorrente mais barato"
          value={summary.opportunities}
          hint={
            market.avgPriceDiff !== null ? `Δ médio ${fmtMoney(market.avgPriceDiff)}` : undefined
          }
          tone="danger"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="Oportunidades"
          value={summary.opportunities}
          hint="Veículos onde o concorrente está mais barato"
          tone="primary"
          icon={<Target className="h-5 w-5" />}
        />
        <MetricCard
          label="Diferenciais"
          value={summary.differentials}
          hint="Veículos onde você está mais barato"
          icon={<Package className="h-5 w-5" />}
        />
        <MetricCard
          label="Comparações"
          value={summary.totalComparisons}
          hint={`${summary.totalMyVehicles} no estoque · ${summary.totalCompetitorVehicles} concorrência`}
          icon={<GitCompareArrows className="h-5 w-5" />}
        />
      </div>

      {/* Competitividade detalhada + Insights */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Competitividade Geral"
          description="Sua posição relativa em comparações ativas"
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold tabular-nums">
                {fmtPercent(competitiveness.percent)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{ctone.label}</span>
            </div>
            <Progress value={competitiveness.percent ?? 0} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Você</p>
                <p className="font-semibold tabular-nums text-emerald-500">
                  {comparison.meCheaper}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Empates</p>
                <p className="font-semibold tabular-nums">{comparison.ties}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Concorrente</p>
                <p className="font-semibold tabular-nums text-red-500">
                  {comparison.competitorCheaper}
                </p>
              </div>
            </div>
          </div>
        </SummaryCard>

        <SummaryCard
          title="Resumo Executivo"
          description="Insights automáticos baseados nas métricas atuais"
          className="lg:col-span-2"
          action={<Sparkles className="h-4 w-4 text-[#F97316]" />}
        >
          {insights.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {insights.map((i) => (
                <InsightCard key={i.id} tone={i.tone} title={i.title} description={i.description} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem insights disponíveis. Importe veículos e execute comparações para gerar análises.
            </p>
          )}
        </SummaryCard>
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Distribuição por Marca" description="Top marcas no seu estoque">
          <RankingBarChart
            entries={data.inventory.byBrand.slice(0, 7)}
            label="Sem marcas cadastradas"
          />
        </SummaryCard>
        <SummaryCard title="Distribuição por Concorrente" description="Volume por loja monitorada">
          <RankingBarChart
            entries={competitors.byCompetitor.slice(0, 7)}
            label="Nenhum concorrente com veículos"
          />
        </SummaryCard>
        <SummaryCard title="Faixa de Preços" description="Distribuição comparativa por faixa">
          <PriceDistributionChart data={distribution} />
        </SummaryCard>
        <SummaryCard title="Comparações por Status" description="Distribuição dos resultados">
          <ComparisonStatusChart
            meCheaper={comparison.meCheaper}
            competitorCheaper={comparison.competitorCheaper}
            ties={comparison.ties}
            unmatched={comparison.unmatched}
          />
        </SummaryCard>
      </div>

      {/* Radar de Competitividade */}
      <div className="mt-6">
        <SummaryCard
          title="Radar de Competitividade"
          description="Veículos do seu estoque que exigem ação. Apenas prioridades Alta e Média."
          action={<Radar className="h-4 w-4 text-destructive" />}
        >
          <RadarPanel compact />
        </SummaryCard>
      </div>

      {/* Estratégia de Preço */}
      <div className="mt-6">
        <SummaryCard
          title="Estratégia de Preço"
          description="Recomendação comercial e cenários simulados por veículo. Apenas itens com recomendação."
          action={<Wallet className="h-4 w-4 text-primary" />}
        >
          <StrategyPanel compact />
        </SummaryCard>
      </div>




      {/* Ranking + Oportunidades */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Top 10 Concorrentes"
          description="Por volume de veículos"
          className="lg:col-span-2"
          action={<Users className="h-4 w-4 text-muted-foreground" />}
        >
          <RankingCard entries={competitors.byCompetitor.slice(0, 10)} />
        </SummaryCard>
        <SummaryCard
          title="Oportunidades por Marca"
          description="Marcas com mais movimento na concorrência"
        >
          <OpportunityCard
            items={competitors.byBrand.slice(0, 6).map((b) => ({
              label: b.key,
              value: b.count,
            }))}
          />
        </SummaryCard>
      </div>
    </div>
  );
}
