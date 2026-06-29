import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileBarChart, FileDown, FileSpreadsheet } from "lucide-react";
import { useActiveBaseCompanies } from "@/features/base-companies/hooks/useBaseCompanies";
import { useReportSummary } from "@/features/reports/hooks/useReportSummary";
import {
  exportDashboardToPDF,
  exportDashboardToExcel,
} from "@/features/dashboard/utils/export";
import { DEFAULT_FILTERS } from "@/features/dashboard/preferences/types";

const ALL = "__all__";

function RelatoriosPage() {
  const [baseCompanyId, setBaseCompanyId] = useState<string | null>(null);
  const { data: companies } = useActiveBaseCompanies();
  const { data, isLoading, isError, error } = useReportSummary(baseCompanyId);

  const selectedName =
    companies?.find((c) => c.id === baseCompanyId)?.name ?? "Todas as empresas";

  const handlePdf = () => {
    if (!data) return;
    try {
      exportDashboardToPDF(data, DEFAULT_FILTERS, baseCompanyId);
      toast.success("Relatório PDF gerado");
    } catch (e) {
      toast.error("Falha ao gerar PDF", { description: (e as Error).message });
    }
  };

  const handleExcel = () => {
    if (!data) return;
    try {
      exportDashboardToExcel(data, DEFAULT_FILTERS, baseCompanyId);
      toast.success("Relatório Excel gerado");
    } catch (e) {
      toast.error("Falha ao gerar Excel", { description: (e as Error).message });
    }
  };

  return (
    <div>
      <PageHeader
        title={`Comparativo de Mercado — ${selectedName}`}
        description="Relatório consolidado Minha Loja → Mercado, alimentado pelo Analytics Engine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={baseCompanyId ?? ALL}
              onValueChange={(v) => setBaseCompanyId(v === ALL ? null : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Empresa Base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as empresas</SelectItem>
                {companies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePdf} disabled={!data || isLoading}>
              <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExcel} disabled={!data || isLoading}>
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
            </Button>
          </div>
        }
      />

      {isError && (
        <EmptyState
          icon={FileBarChart}
          title="Erro ao carregar relatório"
          description={(error as Error).message}
        />
      )}

      {!isError && (isLoading || !data) && (
        <EmptyState
          icon={FileBarChart}
          title="Carregando indicadores…"
          description="Compondo dados do Analytics Engine."
        />
      )}

      {!isError && data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Veículos monitorados" value={data.summary.totalMyVehicles} />
          <Kpi label="Concorrentes" value={data.summary.totalCompetitors} />
          <Kpi label="Veículos da concorrência" value={data.summary.totalCompetitorVehicles} />
          <Kpi label="Comparações" value={data.summary.totalComparisons} />
          <Kpi label="Diferenciais (você mais barato)" value={data.summary.differentials} />
          <Kpi label="Oportunidades" value={data.summary.opportunities} />
          <Kpi
            label="Competitividade"
            value={
              data.competitiveness.percent === null
                ? "—"
                : `${data.competitiveness.percent}% · ${data.competitiveness.level}`
            }
          />
          <Kpi
            label="Δ médio (R$)"
            value={
              data.market.avgPriceDiff === null
                ? "—"
                : data.market.avgPriceDiff.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
            }
          />
          <Kpi
            label="Economia total (R$)"
            value={
              data.comparison.totalSavings === null
                ? "—"
                : data.comparison.totalSavings.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
            }
          />
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-normal">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · PriceCompare" }] }),
  component: RelatoriosPage,
});
