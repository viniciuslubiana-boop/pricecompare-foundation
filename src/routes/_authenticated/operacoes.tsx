import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Download,
  GitCompareArrows,
  LayoutDashboard,
  Package,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useOperations, type ActivityItem } from "@/features/operations";

export const Route = createFileRoute("/_authenticated/operacoes")({
  head: () => ({
    meta: [
      { title: "Centro de Operações · PriceCompare" },
      { name: "description", content: "Painel operacional do PriceCompare." },
    ],
  }),
  component: OperationsPage,
});

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface OpCardProps {
  title: string;
  count: number;
  lastUpdated: string | null;
  status: "ok" | "warning" | "empty";
  icon: React.ReactNode;
  to: string;
  actionLabel: string;
}

function OpCard({ title, count, lastUpdated, status, icon, to, actionLabel }: OpCardProps) {
  const badge =
    status === "ok"
      ? { label: "OK", className: "bg-emerald-500/15 text-emerald-600" }
      : status === "warning"
        ? { label: "Atenção", className: "bg-amber-500/15 text-amber-600" }
        : { label: "Vazio", className: "bg-muted text-muted-foreground" };
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Badge variant="secondary" className={badge.className}>
          {badge.label}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{count}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Última atualização: {fmtDate(lastUpdated)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={to}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

const ACTIVITY_META: Record<ActivityItem["kind"], { label: string; icon: React.ReactNode }> = {
  import: { label: "Importação", icon: <Upload className="h-3.5 w-3.5" /> },
  extraction: { label: "Extração", icon: <Download className="h-3.5 w-3.5" /> },
  comparison: { label: "Comparação", icon: <GitCompareArrows className="h-3.5 w-3.5" /> },
};

function isRecent(iso: string | null, hours: number) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < hours * 60 * 60 * 1000;
}

function OperationsPage() {
  const { data, isLoading, isError, error, refetch } = useOperations();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Centro de Operações" description="Carregando..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Centro de Operações" />
        <ErrorState
          description={(error as Error | undefined)?.message ?? "Tente novamente."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { totals, lastUpdated, errors, opportunities, activities } = data;
  const hasErrors = errors.imports + errors.extractions > 0;

  const cards: OpCardProps[] = [
    {
      title: "Estoque",
      count: totals.myVehicles,
      lastUpdated: lastUpdated.inventory,
      status: totals.myVehicles ? "ok" : "empty",
      icon: <Package className="h-4 w-4" />,
      to: "/meu-estoque",
      actionLabel: "Abrir estoque",
    },
    {
      title: "Concorrentes",
      count: totals.competitors,
      lastUpdated: lastUpdated.competitors,
      status: totals.competitors ? "ok" : "empty",
      icon: <Users className="h-4 w-4" />,
      to: "/concorrentes",
      actionLabel: "Gerenciar",
    },
    {
      title: "Importações",
      count: totals.imports,
      lastUpdated: lastUpdated.imports,
      status: errors.imports ? "warning" : totals.imports ? "ok" : "empty",
      icon: <Upload className="h-4 w-4" />,
      to: "/importacoes",
      actionLabel: "Ver histórico",
    },
    {
      title: "Comparações",
      count: totals.comparisons,
      lastUpdated: lastUpdated.comparisons,
      status: totals.comparisons ? "ok" : "empty",
      icon: <GitCompareArrows className="h-4 w-4" />,
      to: "/comparar",
      actionLabel: "Comparar mercado",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Centro de Operações"
        description="Painel operacional integrando estoque, concorrentes, importações, extrações e comparações."
        actions={
          <Button asChild variant="outline">
            <Link to="/">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <OpCard key={c.title} {...c} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Checklist Diário</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <ChecklistItem
                ok={isRecent(lastUpdated.inventory, 24)}
                label="Estoque atualizado nas últimas 24h"
              />
              <ChecklistItem
                ok={isRecent(lastUpdated.extractions, 24)}
                label="Concorrentes atualizados nas últimas 24h"
              />
              <ChecklistItem
                ok={isRecent(lastUpdated.comparisons, 24)}
                label="Comparação executada nas últimas 24h"
              />
              <ChecklistItem ok={!hasErrors} label="Sem erros recentes em importações/extrações" />
              <ChecklistItem
                ok={opportunities > 0}
                label={`Oportunidades identificadas (${opportunities})`}
              />
            </ul>
            {hasErrors ? (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {errors.imports} importação(ões) e {errors.extractions} extração(ões) com erro.
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimas Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length ? (
              <ul className="divide-y divide-border">
                {activities.map((a) => {
                  const meta = ACTIVITY_META[a.kind];
                  const failed = a.status === "failed";
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-muted-foreground">{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {meta.label} · {fmtDate(a.at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          failed ? "bg-red-500/15 text-red-600" : "bg-muted text-muted-foreground"
                        }
                      >
                        {failed ? (
                          <XCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        {a.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={Activity}
                title="Nenhuma atividade recente"
                description="As próximas importações, extrações e comparações aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/importacoes">
              <Upload className="h-4 w-4" /> Importar Estoque
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/concorrentes">
              <Users className="h-4 w-4" /> Novo Concorrente
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/comparar">
              <GitCompareArrows className="h-4 w-4" /> Comparar Mercado
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">
              <LayoutDashboard className="h-4 w-4" /> Dashboard Executivo
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
