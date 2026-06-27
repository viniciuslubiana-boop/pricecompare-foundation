import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Plus,
  Trash2,
  Target,
  ExternalLink,
} from "lucide-react";
import { useMarketMovements } from "@/features/market-update";
import { filterMovementsChanges } from "@/features/analytics/calculators/market-movements";
import type { MarketChangeRow } from "@/features/market-update";

export const Route = createFileRoute("/_authenticated/movimentacoes-mercado")({
  head: () => ({
    meta: [
      { title: "Central de Movimentações · PriceCompare" },
      {
        name: "description",
        content:
          "Visão consolidada do que mudou no mercado e do impacto direto no seu estoque.",
      },
    ],
  }),
  component: MovementsCenterPage,
});

const fmtBRL = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function ChangeBadge({ type }: { type: MarketChangeRow["change_type"] }) {
  if (type === "new")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
        <Plus className="h-3 w-3 mr-1" /> Novo
      </Badge>
    );
  if (type === "removed")
    return (
      <Badge className="bg-red-500/15 text-red-600 border-red-500/30">
        <Trash2 className="h-3 w-3 mr-1" /> Removido
      </Badge>
    );
  if (type === "price")
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
        <Activity className="h-3 w-3 mr-1" /> Preço
      </Badge>
    );
  return <Badge variant="secondary">KM</Badge>;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "warning" | "danger" | "info" | "primary";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-500"
      : tone === "warning"
        ? "text-amber-500"
        : tone === "danger"
          ? "text-red-500"
          : tone === "info"
            ? "text-sky-500"
            : tone === "primary"
              ? "text-primary"
              : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ChangesTable({
  rows,
  emptyText,
}: {
  rows: MarketChangeRow[];
  emptyText: string;
}) {
  if (!rows.length)
    return <EmptyState title="Nada por aqui" description={emptyText} />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Concorrente</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead className="text-right">Anterior</TableHead>
            <TableHead className="text-right">Atual</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 50).map((r) => {
            const vehicle =
              [r.brand, r.model, r.year_model].filter(Boolean).join(" ") || "—";
            const arrow =
              r.change_type === "price" && r.price_diff != null && r.price_diff < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-emerald-500 inline" />
              ) : r.change_type === "price" && r.price_diff != null && r.price_diff > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-amber-500 inline" />
              ) : null;
            return (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {fmtDate(r.detected_at)}
                </TableCell>
                <TableCell className="text-sm">{r.competitor_name}</TableCell>
                <TableCell className="font-medium">{vehicle}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtBRL(r.previous_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtBRL(r.current_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {arrow} {fmtPct(r.price_diff_pct)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MovementsCenterPage() {
  const [windowHours, setWindowHours] = useState<string>("24");
  const sinceHours = windowHours === "all" ? "all" : Number(windowHours);
  const { data, isLoading, isError, refetch } = useMarketMovements({ sinceHours });

  const [onlyPrice, setOnlyPrice] = useState(false);
  const [onlyImpact, setOnlyImpact] = useState(false);
  const [competitor, setCompetitor] = useState<string>("all");

  const competitors = useMemo(() => {
    const set = new Set<string>();
    const all = [
      ...(data?.blocks.newAds ?? []),
      ...(data?.blocks.removedAds ?? []),
      ...(data?.blocks.priceChanges ?? []),
    ];
    all.forEach((r) => r.competitor_name && set.add(r.competitor_name));
    return Array.from(set).sort();
  }, [data]);

  const filter = useMemo(
    () => ({
      onlyPrice,
      onlyImpact,
      competitorName: competitor === "all" ? null : competitor,
    }),
    [onlyPrice, onlyImpact, competitor],
  );

  const filtered = useMemo(() => {
    if (!data) return null;
    const all = [
      ...data.blocks.newAds,
      ...data.blocks.removedAds,
      ...data.blocks.priceChanges,
      ...data.blocks.kmChanges,
    ];
    const f = filterMovementsChanges(all, data.blocks.impacts, filter);
    const ids = new Set(f.map((r) => r.id));
    return {
      newAds: data.blocks.newAds.filter((r) => ids.has(r.id)),
      removedAds: data.blocks.removedAds.filter((r) => ids.has(r.id)),
      priceChanges: data.blocks.priceChanges.filter((r) => ids.has(r.id)),
      impacts: data.blocks.impacts.filter((i) => ids.has(i.change.id)),
    };
  }, [data, filter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Central de Movimentações do Mercado"
          description="Tudo que mudou desde a última atualização e o impacto direto no seu estoque."
        />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Central de Movimentações do Mercado" />
        <ErrorState
          description="Falha ao carregar movimentações."
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const { summary } = data.blocks;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Movimentações do Mercado"
        description="O que mudou, quem mudou e — principalmente — o que impacta o seu estoque."
      />

      {/* Bloco 5: Resumo */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Concorrentes atualizados" value={summary.competitorsUpdated} tone="info" />
        <StatCard label="Veículos monitorados" value={summary.vehiclesMonitored} />
        <StatCard label="Novos anúncios" value={summary.newCount} tone="success" />
        <StatCard label="Removidos" value={summary.removedCount} tone="danger" />
        <StatCard label="Alterações de preço" value={summary.priceChangeCount} tone="warning" />
        <StatCard
          label="Meu estoque impactado"
          value={summary.impactedMyVehicles}
          tone="primary"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={windowHours} onValueChange={setWindowHours}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">Últimas 24h</SelectItem>
                <SelectItem value="72">Últimos 3 dias</SelectItem>
                <SelectItem value="168">Última semana</SelectItem>
                <SelectItem value="all">Tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Concorrente</Label>
            <Select value={competitor} onValueChange={setCompetitor}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {competitors.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={onlyPrice} onCheckedChange={setOnlyPrice} id="f-price" />
            <Label htmlFor="f-price">Apenas alterações de preço</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={onlyImpact} onCheckedChange={setOnlyImpact} id="f-impact" />
            <Label htmlFor="f-impact">Apenas impacto no meu estoque</Label>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 4: Impactos no meu estoque (mais importante) */}
      <Card className="border-primary/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              Mudanças que impactam meu estoque
              <Badge variant="secondary" className="ml-2">
                {filtered?.impacts.length ?? 0}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!filtered?.impacts.length ? (
            <div className="p-4">
              <EmptyState
                title="Nenhuma alteração impacta seu estoque agora"
                description="Quando concorrentes mexerem em veículos iguais aos seus, eles aparecem aqui."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concorrente</TableHead>
                    <TableHead>Meu veículo</TableHead>
                    <TableHead className="text-right">Meu preço</TableHead>
                    <TableHead className="text-right">Preço concorrente</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead className="text-center">Minha posição</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.impacts.map((i) => {
                    const veh = [i.myBrand, i.myModel, i.myYear].filter(Boolean).join(" ");
                    const diffArrow =
                      i.diff != null && i.diff < 0 ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500 inline" />
                      ) : i.diff != null && i.diff > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500 inline" />
                      ) : null;
                    return (
                      <TableRow key={`${i.change.id}-${i.myVehicleId}`}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {fmtDate(i.change.detected_at)}
                        </TableCell>
                        <TableCell>
                          <ChangeBadge type={i.change.change_type} />
                        </TableCell>
                        <TableCell className="text-sm">{i.change.competitor_name}</TableCell>
                        <TableCell className="font-medium">{veh}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {fmtBRL(i.myPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {fmtBRL(i.competitorPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {diffArrow} {fmtBRL(i.diff)}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({fmtPct(i.diffPct)})
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {i.intelligence.rankPosition != null
                            ? `${i.intelligence.rankPosition}º de ${i.intelligence.competitorCount + 1}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              to="/veiculo/$id"
                              params={{ id: i.myVehicleId }}
                            >
                              Abrir Comparação
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bloco 1: Novos anúncios */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-500" />
              Novos anúncios
              <Badge variant="secondary" className="ml-1">
                {filtered?.newAds.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChangesTable
              rows={filtered?.newAds ?? []}
              emptyText="Nenhum anúncio novo no período."
            />
          </CardContent>
        </Card>

        {/* Bloco 2: Removidos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              Anúncios removidos
              <Badge variant="secondary" className="ml-1">
                {filtered?.removedAds.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChangesTable
              rows={filtered?.removedAds ?? []}
              emptyText="Nenhum anúncio removido no período."
            />
          </CardContent>
        </Card>
      </div>

      {/* Bloco 3: Alterações de preço */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            Alterações de preço
            <Badge variant="secondary" className="ml-1">
              {filtered?.priceChanges.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ChangesTable
            rows={filtered?.priceChanges ?? []}
            emptyText="Nenhum reajuste detectado no período."
          />
        </CardContent>
      </Card>
    </div>
  );
}
