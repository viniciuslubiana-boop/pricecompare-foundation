import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedBaseCompany } from "@/features/base-companies/context/SelectedBaseCompanyContext";
import { fipeQualityService } from "@/features/fipe/services/fipe-quality.service";

export const Route = createFileRoute("/_authenticated/qualidade-fipe")({
  head: () => ({
    meta: [
      { title: "Qualidade FIPE · PriceCompare" },
      {
        name: "description",
        content:
          "Cobertura FIPE, motivos de rejeição, marcas e modelos com problemas. Indicadores derivados dos logs oficiais.",
      },
    ],
  }),
  component: QualidadeFipePage,
});

function QualidadeFipePage() {
  const { isAdmin } = useAuth();
  const { selectedId } = useSelectedBaseCompany();
  const { data } = useQuery({
    queryKey: ["fipe-quality", selectedId],
    queryFn: () => fipeQualityService.load(selectedId),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Qualidade FIPE"
          description="Acesso restrito a administradores."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualidade FIPE"
        description="Indicadores derivados de fipe_update_logs e my_vehicles. Sem cálculos na tela — todos os números vêm do serviço."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Cobertura" value={`${data?.coverage_pct ?? 0}%`} />
        <KpiCard label="Encontrados" value={data?.matched ?? 0} />
        <KpiCard label="Manuais" value={data?.manual ?? 0} />
        <KpiCard label="Não encontrados" value={data?.unmatched ?? 0} />
        <KpiCard label="Não verificados" value={data?.not_verified ?? 0} />
        <KpiCard label="Score médio" value={data?.avg_score ?? 0} />
        <KpiCard label="Tempo médio (ms)" value={data?.avg_query_duration_ms ?? 0} />
        <KpiCard
          label="Última atualização"
          value={data?.last_run_at ? new Date(data.last_run_at).toLocaleString("pt-BR") : "—"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Top motivos de rejeição" items={data?.top_rejection_reasons ?? []} keyName="reason" />
        <ListCard title="Top marcas com problemas" items={data?.top_brand_failures ?? []} keyName="key" />
        <ListCard title="Top modelos sem versão" items={data?.top_model_failures ?? []} keyName="key" />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ListCard({
  title,
  items,
  keyName,
}: {
  title: string;
  items: Array<Record<string, string | number>>;
  keyName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados disponíveis.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{String(it[keyName])}</span>
                <span className="text-muted-foreground tabular-nums">{it.count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
