import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  ExternalLink,
  ArrowDown,
  ArrowUp,
  Minus,
} from "lucide-react";
import { useMarketMonitor } from "@/features/market-update";
import type {
  MarketChangeRow,
  MarketChangeType,
} from "@/features/market-update";
import type { InventoryImpact } from "@/features/analytics/calculators/market-movements";

export const Route = createFileRoute("/_authenticated/monitor-mercado")({
  head: () => ({
    meta: [
      { title: "Monitor de Mercado · PriceCompare" },
      {
        name: "description",
        content:
          "Monitoramento contínuo do mercado: novos anúncios, removidos, preços e impactos no seu estoque.",
      },
    ],
  }),
  component: MarketMonitorPage,
});

type PeriodKey = "today" | "yesterday" | "last7";

function rangeFor(period: PeriodKey): { sinceISO: string; untilISO?: string } {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  if (period === "today") return { sinceISO: startToday.toISOString() };
  if (period === "yesterday") {
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    return { sinceISO: startYesterday.toISOString(), untilISO: startToday.toISOString() };
  }
  const start7 = new Date(now.getTime() - 7 * 24 * 3600_000);
  return { sinceISO: start7.toISOString() };
}

const fmtBRL = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const fmtKM = (v: number | null | undefined) =>
  v == null ? "—" : `${v.toLocaleString("pt-BR")} km`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const norm = (s: string | null | undefined) => (s ?? "").toString().trim().toLowerCase();
const firstToken = (s: string | null | undefined) => norm(s).split(/\s+/)[0] ?? "";

function ChangeBadge({ type }: { type: MarketChangeType }) {
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

function RankDelta({
  prev,
  curr,
}: {
  prev: number | null;
  curr: number | null;
}) {
  if (prev == null || curr == null) return <span className="text-muted-foreground">—</span>;
  if (prev === curr)
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" /> {curr}º
      </span>
    );
  // rank menor = melhor → curr < prev é melhora
  const improved = curr < prev;
  return (
    <span
      className={`inline-flex items-center gap-1 ${improved ? "text-emerald-500" : "text-red-500"}`}
    >
      {improved ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {prev}º → {curr}º
    </span>
  );
}

function ChangesTable({
  rows,
  emptyText,
  showKm,
}: {
  rows: MarketChangeRow[];
  emptyText: string;
  showKm?: boolean;
}) {
  if (!rows.length) return <EmptyState title="Nada por aqui" description={emptyText} />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Concorrente</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead className="text-right">{showKm ? "KM anterior" : "Anterior"}</TableHead>
            <TableHead className="text-right">{showKm ? "KM atual" : "Atual"}</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 100).map((r) => {
            const vehicle = [r.brand, r.model, r.year_model].filter(Boolean).join(" ") || "—";
            const arrow =
              !showKm && r.price_diff != null && r.price_diff < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-emerald-500 inline" />
              ) : !showKm && r.price_diff != null && r.price_diff > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-amber-500 inline" />
              ) : null;
            return (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.detected_at)}</TableCell>
                <TableCell className="text-sm">{r.competitor_name}</TableCell>
                <TableCell className="font-medium">{vehicle}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {showKm ? fmtKM(r.previous_km) : fmtBRL(r.previous_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {showKm ? fmtKM(r.current_km) : fmtBRL(r.current_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {showKm
                    ? r.km_diff != null
                      ? `${r.km_diff > 0 ? "+" : ""}${r.km_diff.toLocaleString("pt-BR")} km`
                      : "—"
                    : (
                      <>
                        {arrow} {fmtPct(r.price_diff_pct)}
                      </>
                    )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ImpactsTable({ impacts }: { impacts: InventoryImpact[] }) {
  if (!impacts.length)
    return (
      <EmptyState
        title="Nenhum impacto no seu estoque"
        description="Mudanças recentes do mercado não afetaram veículos do seu estoque."
      />
    );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Meu preço</TableHead>
            <TableHead className="text-right">Novo preço concorrente</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {impacts.slice(0, 100).map((i) => {
            const vehicle =
              [i.myBrand, i.myModel, i.myYear].filter(Boolean).join(" ") || "—";
            const diffArrow =
              i.diff != null && i.diff > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500 inline" />
              ) : i.diff != null && i.diff < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-red-500 inline" />
              ) : null;
            return (
              <TableRow key={`${i.myVehicleId}-${i.change.id}`}>
                <TableCell className="font-medium">{vehicle}</TableCell>
                <TableCell>
                  <ChangeBadge type={i.change.change_type} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtBRL(i.myPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtBRL(i.competitorPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {diffArrow} {fmtBRL(i.diff)}{" "}
                  <span className="text-xs text-muted-foreground">({fmtPct(i.diffPct)})</span>
                </TableCell>
                <TableCell className="text-sm">
                  <RankDelta prev={i.previousRank} curr={i.currentRank} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/veiculo/$id" params={{ id: i.myVehicleId }}>
                      Abrir comparação <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MarketMonitorPage() {
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [competitor, setCompetitor] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [model, setModel] = useState<string>("all");

  const range = useMemo(() => rangeFor(period), [period]);
  const { data, isLoading, isError, refetch } = useMarketMonitor(range);

  const allRows = useMemo<MarketChangeRow[]>(() => {
    if (!data) return [];
    return [
      ...data.blocks.newAds,
      ...data.blocks.removedAds,
      ...data.blocks.priceChanges,
      ...data.blocks.kmChanges,
    ];
  }, [data]);

  const competitors = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.competitor_name && set.add(r.competitor_name));
    return Array.from(set).sort();
  }, [allRows]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.brand && set.add(r.brand));
    return Array.from(set).sort();
  }, [allRows]);

  const models = useMemo(() => {
    const set = new Set<string>();
    allRows
      .filter((r) => brand === "all" || norm(r.brand) === norm(brand))
      .forEach((r) => r.model && set.add(r.model));
    return Array.from(set).sort();
  }, [allRows, brand]);

  const matches = (r: MarketChangeRow) => {
    if (competitor !== "all" && r.competitor_name !== competitor) return false;
    if (brand !== "all" && norm(r.brand) !== norm(brand)) return false;
    if (model !== "all" && firstToken(r.model) !== firstToken(model)) return false;
    return true;
  };

  const filtered = useMemo(() => {
    if (!data)
      return {
        newAds: [] as MarketChangeRow[],
        removedAds: [] as MarketChangeRow[],
        priceChanges: [] as MarketChangeRow[],
        kmChanges: [] as MarketChangeRow[],
        impacts: [] as InventoryImpact[],
      };
    return {
      newAds: data.blocks.newAds.filter(matches),
      removedAds: data.blocks.removedAds.filter(matches),
      priceChanges: data.blocks.priceChanges.filter(matches),
      kmChanges: data.blocks.kmChanges.filter(matches),
      impacts: data.blocks.impacts.filter((i) => matches(i.change)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, competitor, brand, model]);

  const indicators = useMemo(() => {
    const competitorsMonitored = competitors.length;
    const vehiclesMonitored = data?.blocks.summary.vehiclesMonitored ?? 0;
    const impactedSet = new Set(filtered.impacts.map((i) => i.myVehicleId));
    return {
      competitorsMonitored,
      vehiclesMonitored,
      priceChanges: filtered.priceChanges.length,
      newAds: filtered.newAds.length,
      removed: filtered.removedAds.length,
      impacted: impactedSet.size,
    };
  }, [data, competitors, filtered]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Monitor de Mercado"
          description="Monitoramento contínuo: o que mudou desde a última atualização."
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
        <PageHeader title="Monitor de Mercado" />
        <ErrorState
          description="Falha ao carregar o monitor de mercado."
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor de Mercado"
        description="Monitoramento contínuo: novos anúncios, removidos, alterações de preço e impactos no seu estoque."
      />

      {/* Indicadores */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Concorrentes monitorados"
          value={indicators.competitorsMonitored}
          tone="info"
        />
        <StatCard label="Veículos monitorados" value={indicators.vehiclesMonitored} />
        <StatCard
          label="Alterações de preço"
          value={indicators.priceChanges}
          tone="warning"
        />
        <StatCard label="Novos anúncios" value={indicators.newAds} tone="success" />
        <StatCard label="Removidos" value={indicators.removed} tone="danger" />
        <StatCard
          label="Meu estoque impactado"
          value={indicators.impacted}
          tone="primary"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="last7">Últimos 7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Concorrente</Label>
            <Select value={competitor} onValueChange={setCompetitor}>
              <SelectTrigger className="w-56">
                <SelectValue />
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
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Marca</Label>
            <Select
              value={brand}
              onValueChange={(v) => {
                setBrand(v);
                setModel("all");
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Modelo</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCompetitor("all");
              setBrand("all");
              setModel("all");
            }}
          >
            Limpar filtros
          </Button>
        </CardContent>
      </Card>

      {/* 1. Novos anúncios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-500" />
            Novos anúncios
            <Badge variant="secondary">{filtered.newAds.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangesTable rows={filtered.newAds} emptyText="Nenhum anúncio novo no período." />
        </CardContent>
      </Card>

      {/* 2. Veículos removidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            Veículos removidos
            <Badge variant="secondary">{filtered.removedAds.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangesTable
            rows={filtered.removedAds}
            emptyText="Nenhum anúncio removido no período."
          />
        </CardContent>
      </Card>

      {/* 3. Alterações de preço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            Alterações de preço
            <Badge variant="secondary">{filtered.priceChanges.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangesTable
            rows={filtered.priceChanges}
            emptyText="Nenhuma alteração de preço no período."
          />
        </CardContent>
      </Card>

      {/* 4. Mudanças que impactam meu estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Mudanças que impactam meu estoque
            <Badge variant="secondary">{filtered.impacts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImpactsTable impacts={filtered.impacts} />
        </CardContent>
      </Card>

      {/* 5. Resumo diário */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo diário</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Concorrentes monitorados"
            value={indicators.competitorsMonitored}
            tone="info"
          />
          <StatCard label="Veículos monitorados" value={indicators.vehiclesMonitored} />
          <StatCard
            label="Alterações de preço"
            value={indicators.priceChanges}
            tone="warning"
          />
          <StatCard label="Novos anúncios" value={indicators.newAds} tone="success" />
          <StatCard label="Removidos" value={indicators.removed} tone="danger" />
          <StatCard
            label="Estoque impactado"
            value={indicators.impacted}
            tone="primary"
          />
        </CardContent>
      </Card>

      {/* Alterações de KM (apoio) */}
      {filtered.kmChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alterações de quilometragem</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangesTable
              rows={filtered.kmChanges}
              emptyText="Nenhuma alteração de KM."
              showKm
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
