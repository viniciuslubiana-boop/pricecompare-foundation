import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompetitorStatusBadge } from "@/features/competitors/components/CompetitorStatusBadge";
import { CompetitorImportCard } from "@/features/competitors/components/CompetitorImportCard";
import { CompetitorStockSection } from "@/features/competitors/components/CompetitorStockSection";
import {
  useCompetitor,
  useCompetitorImports,
} from "@/features/competitors/hooks/useCompetitors";

export const Route = createFileRoute("/_authenticated/concorrente/$id")({
  head: () => ({ meta: [{ title: "Detalhe do Concorrente · PriceCompare" }] }),
  component: CompetitorDetailPage,
});

function CompetitorDetailPage() {
  const { id } = Route.useParams();
  const competitorQ = useCompetitor(id);
  const importsQ = useCompetitorImports(id);

  const isLoading = competitorQ.isLoading || importsQ.isLoading;
  const isError = competitorQ.isError || importsQ.isError;
  const error = competitorQ.error || importsQ.error;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando detalhes…
      </div>
    );
  }

  if (isError || !competitorQ.data) {
    return (
      <ErrorState
        title="Não foi possível carregar o concorrente"
        description={(error as Error)?.message}
        onRetry={() => {
          competitorQ.refetch();
          importsQ.refetch();
        }}
      />
    );
  }

  const c = competitorQ.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhe do Concorrente"
        description="Informações gerais e histórico de importações."
        actions={
          <Button variant="outline" asChild>
            <Link to="/concorrentes">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold leading-tight">{c.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CompetitorStatusBadge status={(c.status as "active" | "inactive") ?? "active"} />
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="max-w-[280px] truncate">{c.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span>Sem site identificado</span>
                )}
              </div>
              {c.notes ? (
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.notes}</p>
              ) : null}
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-xs uppercase text-muted-foreground">Última atualização</div>
            <div className="text-sm font-medium tabular-nums">
              {c.updated_at ? new Date(c.updated_at).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <CompetitorStockSection competitorId={c.id} />

      <CompetitorImportCard logs={importsQ.data ?? []} />
    </div>
  );
}
