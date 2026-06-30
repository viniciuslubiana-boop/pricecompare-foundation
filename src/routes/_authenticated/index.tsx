import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ErrorState } from "@/components/ErrorState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  Package,
  Radar,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Sparkles,
  Wallet,
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
  InventoryDrillDown,
  CompetitorsDrillDown,
} from "@/features/dashboard";
import { DashboardBlock } from "@/features/dashboard/widgets/DashboardBlock";
import { DashboardFiltersBar } from "@/features/dashboard/widgets/DashboardFiltersBar";
import { useDashboardPreferences } from "@/features/dashboard/preferences/usePreferences";
import {
  exportDashboardToExcel,
  exportDashboardToPDF,
} from "@/features/dashboard/utils/export";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { MarketUpdateButton } from "@/features/market-update";
import { RadarPanel } from "@/features/comparison/components/RadarPanel";
import { StrategyPanel } from "@/features/comparison/components/StrategyPanel";
import { useState } from "react";

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

function competitivenessTone(level: "high" | "medium" | "low" | "unknown") {
  if (level === "high") return { tone: "success" as const, label: "Alta" };
  if (level === "medium") return { tone: "warning" as const, label: "Média" };
  if (level === "low") return { tone: "danger" as const, label: "Baixa" };
  return { tone: "default" as const, label: "—" };
}

function DashboardPage() {
  const { prefs, update, toggleCollapsed, toggleFavorite, reset } = useDashboardPreferences();
  const { data, isLoading, isError, error, refetch } = useDashboard(prefs.baseCompanyId);
  const [drill, setDrill] = useState<null | "inventory" | "competitors">(null);

  const isCollapsed = (id: string) => prefs.collapsed.includes(id);
  const isFavorite = (id: string) => prefs.favorites.includes(id);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard Executivo" description="Carregando indicadores..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
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
  void market;
  const ctone = competitivenessTone(competitiveness.level);

  return (
    <div>
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada do mercado, do estoque e da concorrência."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MarketUpdateButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => exportDashboardToPDF(data, prefs.filters, prefs.baseCompanyId)}
                >
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportDashboardToExcel(data, prefs.filters, prefs.baseCompanyId)}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <DashboardFiltersBar
        baseCompanyId={prefs.baseCompanyId}
        onBaseCompanyChange={(id) => update({ baseCompanyId: id })}
        filters={prefs.filters}
        onFiltersChange={(patch) => update({ filters: { ...prefs.filters, ...patch } })}
        onReset={reset}
      />

      {/* VISÃO GERAL */}
      <DashboardBlock
        id="visao-geral"
        title="Visão Geral"
        description="Resumo do que está sendo monitorado."
        collapsed={isCollapsed("visao-geral")}
        onToggleCollapsed={() => toggleCollapsed("visao-geral")}
        favorite={isFavorite("visao-geral")}
        onToggleFavorite={() => toggleFavorite("visao-geral")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Veículos monitorados"
            value={summary.totalMyVehicles}
            hint="Clique para detalhar"
            icon={<Package className="h-5 w-5" />}
            onClick={() => setDrill("inventory")}
          />
          <MetricCard
            label="Concorrentes monitorados"
            value={summary.totalCompetitors}
            hint={`${summary.totalCompetitorVehicles} veículos · clique para detalhar`}
            icon={<Users className="h-5 w-5" />}
            onClick={() => setDrill("competitors")}
          />
          <MetricCard
            label="Veículos comparados"
            value={summary.totalComparisons}
            hint="Total no Comparison Engine"
            icon={<GitCompareArrows className="h-5 w-5" />}
          />
          <MetricCard
            label="Competitividade"
            value={fmtPercent(competitiveness.percent)}
            hint={ctone.label}
            tone={ctone.tone}
            icon={<Trophy className="h-5 w-5" />}
          />
        </div>
      </DashboardBlock>

      {/* COMPETITIVIDADE */}
      <DashboardBlock
        id="competitividade"
        title="Competitividade"
        description="Posição, radar e estratégia de preço."
        collapsed={isCollapsed("competitividade")}
        onToggleCollapsed={() => toggleCollapsed("competitividade")}
        favorite={isFavorite("competitividade")}
        onToggleFavorite={() => toggleFavorite("competitividade")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Diferenciais (você mais barato)"
            value={summary.differentials}
            hint={
              comparison.totalSavings
                ? `Economia agregada ${fmtMoney(comparison.totalSavings)}`
                : "Veículos onde você está mais barato"
            }
            tone="success"
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <MetricCard
            label="Oportunidades (concorrente mais barato)"
            value={summary.opportunities}
            hint={
              comparison.avgDiff !== null
                ? `Δ médio por comparação ${fmtMoney(comparison.avgDiff)}`
                : "Veículos onde o concorrente está mais barato"
            }
            tone="danger"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            label="Empates"
            value={comparison.ties}
            hint="Veículos com preço equivalente"
            tone="primary"
            icon={<Target className="h-5 w-5" />}
          />
          <MetricCard
            label="Total de comparações"
            value={comparison.total}
            hint={
              comparison.unmatched
                ? `${comparison.unmatched} sem match`
                : "Matches ativos no Comparison Engine"
            }
            icon={<Package className="h-5 w-5" />}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <SummaryCard
            title="Competitividade Geral"
            description="Sua posição em comparações ativas"
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

        <div className="mt-4">
          <SummaryCard
            title="Radar de Competitividade"
            description="Veículos do seu estoque que exigem ação. Prioridades Alta e Média."
            action={<Radar className="h-4 w-4 text-destructive" />}
          >
            <RadarPanel compact />
          </SummaryCard>
        </div>

        <div className="mt-4">
          <SummaryCard
            title="Estratégia de Preço"
            description="Recomendação comercial e cenários simulados."
            action={<Wallet className="h-4 w-4 text-primary" />}
          >
            <StrategyPanel compact />
          </SummaryCard>
        </div>
      </DashboardBlock>

      {/* MERCADO */}
      <DashboardBlock
        id="mercado"
        title="Mercado"
        description="Distribuição, faixa de preços e movimentação."
        collapsed={isCollapsed("mercado")}
        onToggleCollapsed={() => toggleCollapsed("mercado")}
        favorite={isFavorite("mercado")}
        onToggleFavorite={() => toggleFavorite("mercado")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
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
      </DashboardBlock>

      {/* OPERAÇÃO */}
      <DashboardBlock
        id="operacao"
        title="Operação"
        description="Concorrentes, oportunidades por marca e atalhos."
        collapsed={isCollapsed("operacao")}
        onToggleCollapsed={() => toggleCollapsed("operacao")}
        favorite={isFavorite("operacao")}
        onToggleFavorite={() => toggleFavorite("operacao")}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            title="Top 10 Concorrentes"
            description="Por volume de veículos"
            className="lg:col-span-2"
            action={<Users className="h-4 w-4 text-muted-foreground" />}
          >
            <RankingCard entries={competitors.byCompetitor.slice(0, 10)} />
          </SummaryCard>
          <SummaryCard
            title="Marcas na Concorrência"
            description="Volume de veículos por marca nas lojas monitoradas"
          >
            <OpportunityCard
              items={competitors.byBrand.slice(0, 6).map((b) => ({
                label: b.key,
                value: b.count,
              }))}
            />
          </SummaryCard>
        </div>
      </DashboardBlock>

      {/* Drill-downs */}
      <DrillDownDrawer
        open={drill === "inventory"}
        onOpenChange={(o) => setDrill(o ? "inventory" : null)}
        title="Veículos monitorados"
        description="Lista completa do estoque consumindo o Inventory Engine."
      >
        <InventoryDrillDown baseCompanyId={prefs.baseCompanyId} />
      </DrillDownDrawer>
      <DrillDownDrawer
        open={drill === "competitors"}
        onOpenChange={(o) => setDrill(o ? "competitors" : null)}
        title="Concorrentes monitorados"
        description="Lojas monitoradas e volume de veículos por concorrente."
      >
        <CompetitorsDrillDown />
      </DrillDownDrawer>
    </div>
  );
}
