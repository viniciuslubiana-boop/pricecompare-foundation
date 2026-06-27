import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Plus,
  Trash2,
  Gauge,
  ExternalLink,
  History,
} from "lucide-react";
import {
  useMarketHistory,
  useDerivedHistory,
} from "@/features/market-update/hooks/useMarketHistory";
import type { MarketChangeRow } from "@/features/market-update/types";
import type { VehicleHistoryAggregate } from "@/features/analytics/calculators/market-history";

export const Route = createFileRoute("/_authenticated/historico-mercado")({
  head: () => ({
    meta: [
      { title: "Histórico de Mercado · PriceCompare" },
      {
        name: "description",
        content:
          "Evolução de preços e KM dos concorrentes, com indicadores e impacto no seu estoque.",
      },
    ],
  }),
  component: MarketHistoryPage,
});

const fmtBRL = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(1)}%`);
const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function ChangeTypeBadge({ type }: { type: MarketChangeRow["change_type"] }) {
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
  return (
    <Badge variant="secondary">
      <Gauge className="h-3 w-3 mr-1" /> KM
    </Badge>
  );
}

function Indicator({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "warning" | "danger" | "info" | "stock";
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
            : tone === "stock"
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

function MarketHistoryPage() {
  const [windowHours, setWindowHours] = useState<string>("168");
  const sinceHours = windowHours === "all" ? undefined : Number(windowHours);
  const { data: bundle, isLoading, isError, refetch } = useMarketHistory({ sinceHours });

  const [competitor, setCompetitor] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [model, setModel] = useState<string>("");
  const [direction, setDirection] = useState<"all" | "drop" | "up">("all");
  const [onlyStockImpacted, setOnlyStockImpacted] = useState(false);
  const [onlyAbove2, setOnlyAbove2] = useState(false);

  const filters = useMemo(
    () => ({
      competitorName: competitor === "all" ? null : competitor,
      brand: brand === "all" ? null : brand,
      model: model.trim() || null,
      direction: direction === "all" ? null : direction,
      onlyStockImpacted,
      minPctAbs: onlyAbove2 ? 2 : null,
    }),
    [competitor, brand, model, direction, onlyStockImpacted, onlyAbove2],
  );

  const { filtered, summary, perVehicle } = useDerivedHistory(bundle, filters);

  const [vehicleDetail, setVehicleDetail] = useState<VehicleHistoryAggregate | null>(null);
  const detailRows = useMemo(() => {
    if (!vehicleDetail) return [] as MarketChangeRow[];
    return filtered
      .filter((r) => r.vehicle_key === vehicleDetail.vehicleKey)
      .sort((a, b) => +new Date(b.detected_at) - +new Date(a.detected_at));
  }, [vehicleDetail, filtered]);

  const enrichmentByKey = bundle?.enrichmentByKey;
  const getSourceUrl = (r: MarketChangeRow): string | null => {
    if (!enrichmentByKey) return null;
    return enrichmentByKey.get(`${r.competitor_name}|${r.vehicle_key}`)?.sourceUrl ?? null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Mercado"
        description="Evolução de preço e KM dos concorrentes — quem mudou, o quê, quando e quanto."
      />

      {/* Indicadores */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Indicator label="Total de alterações" value={summary.total} tone="info" />
        <Indicator label="Reduções de preço" value={summary.priceReduced} tone="success" />
        <Indicator label="Aumentos de preço" value={summary.priceIncreased} tone="warning" />
        <Indicator label="Veículos novos" value={summary.newVehicles} tone="success" />
        <Indicator label="Removidos" value={summary.removed} tone="danger" />
        <Indicator
          label="Meu estoque impactado"
          value={summary.stockImpactedVehicles}
          tone="stock"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={windowHours} onValueChange={setWindowHours}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24">Últimas 24h</SelectItem>
                <SelectItem value="72">Últimos 3 dias</SelectItem>
                <SelectItem value="168">Última semana</SelectItem>
                <SelectItem value="720">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Concorrente</Label>
            <Select value={competitor} onValueChange={setCompetitor}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(bundle?.competitors ?? []).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Marca</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(bundle?.brands ?? []).map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Modelo (início)</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ex.: Onix"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Direção do preço</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "all" | "drop" | "up")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="drop">Somente quedas</SelectItem>
                <SelectItem value="up">Somente aumentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <Switch
              checked={onlyStockImpacted}
              onCheckedChange={setOnlyStockImpacted}
              id="f-stock"
            />
            <Label htmlFor="f-stock">Somente impacto no meu estoque</Label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <Switch checked={onlyAbove2} onCheckedChange={setOnlyAbove2} id="f-2pct" />
            <Label htmlFor="f-2pct">Apenas variação ≥ 2%</Label>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alterações */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              description="Falha ao carregar histórico."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : !filtered.length ? (
            <EmptyState
              title="Sem alterações no período"
              description="Ajuste os filtros ou execute uma atualização de mercado."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Concorrente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Impacto</TableHead>
                    <TableHead className="text-right">Anúncio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const vehicle =
                      [r.brand, r.model, r.year_model].filter(Boolean).join(" ") || "—";
                    const isPrice = r.change_type === "price";
                    const isKm = r.change_type === "km";
                    const arrow =
                      isPrice && r.price_diff != null && r.price_diff < 0 ? (
                        <ArrowDownRight className="h-4 w-4 text-emerald-500 inline" />
                      ) : isPrice && r.price_diff != null && r.price_diff > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-amber-500 inline" />
                      ) : null;
                    const url = getSourceUrl(r);
                    const stockImpacted = bundle?.stockKeys.has(r.vehicle_key) ?? false;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {fmtDate(r.detected_at)}
                        </TableCell>
                        <TableCell className="text-sm">{r.competitor_name}</TableCell>
                        <TableCell><ChangeTypeBadge type={r.change_type} /></TableCell>
                        <TableCell className="font-medium">{vehicle}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {isKm
                            ? (r.previous_km?.toLocaleString("pt-BR") ?? "—")
                            : fmtBRL(r.previous_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {isKm
                            ? (r.current_km?.toLocaleString("pt-BR") ?? "—")
                            : fmtBRL(r.current_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {isPrice ? (
                            <span>
                              {arrow} {fmtBRL(r.price_diff)} ({fmtPct(r.price_diff_pct)})
                            </span>
                          ) : isKm && r.km_diff != null ? (
                            `${r.km_diff > 0 ? "+" : ""}${r.km_diff.toLocaleString("pt-BR")} km`
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {stockImpacted ? (
                            <Badge className="bg-primary/15 text-primary border-primary/30">
                              Meu estoque
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                            >
                              Abrir <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
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

      {/* Visão por veículo */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Histórico por veículo</h3>
              <p className="text-xs text-muted-foreground">
                Min, max e preço atual de cada veículo no período filtrado.
              </p>
            </div>
            <Badge variant="secondary">{perVehicle.length} veículos</Badge>
          </div>
          {!perVehicle.length ? (
            <div className="p-4">
              <EmptyState
                title="Nenhum veículo agregado"
                description="Sem alterações suficientes para o período/filtros atuais."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Concorrentes</TableHead>
                    <TableHead className="text-right">Alterações</TableHead>
                    <TableHead className="text-right">Menor</TableHead>
                    <TableHead className="text-right">Maior</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead>Última alteração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perVehicle.map((v) => {
                    const title =
                      [v.brand, v.model, v.yearModel].filter(Boolean).join(" ") || "—";
                    return (
                      <TableRow key={v.vehicleKey}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {title}
                            {v.stockImpacted ? (
                              <Badge className="bg-primary/15 text-primary border-primary/30">
                                Meu estoque
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                          {v.competitors.join(", ")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{v.changesCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(v.minPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(v.maxPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(v.currentPrice)}</TableCell>
                        <TableCell className="text-xs">
                          <div>{fmtDate(v.lastChangeAt)}</div>
                          <div className="text-muted-foreground">
                            {v.lastChangeCompetitor ?? "—"}
                            {v.lastChangeDiff != null
                              ? ` · ${fmtBRL(v.lastChangeDiff)} (${fmtPct(v.lastChangeDiffPct)})`
                              : ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setVehicleDetail(v)}
                          >
                            <History className="h-4 w-4" /> Histórico
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

      <Dialog open={!!vehicleDetail} onOpenChange={(o) => !o && setVehicleDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {vehicleDetail
                ? [vehicleDetail.brand, vehicleDetail.model, vehicleDetail.yearModel]
                    .filter(Boolean)
                    .join(" ") || "Veículo"
                : "Veículo"}
            </DialogTitle>
            <DialogDescription>
              Histórico de alterações no período filtrado.
            </DialogDescription>
          </DialogHeader>
          {vehicleDetail ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Indicator label="Menor preço" value={fmtBRL(vehicleDetail.minPrice)} tone="success" />
                <Indicator label="Maior preço" value={fmtBRL(vehicleDetail.maxPrice)} tone="warning" />
                <Indicator label="Preço atual" value={fmtBRL(vehicleDetail.currentPrice)} tone="info" />
                <Indicator label="Alterações" value={vehicleDetail.changesCount} />
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Concorrente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Anterior</TableHead>
                      <TableHead className="text-right">Atual</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead className="text-right">Anúncio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailRows.map((r) => {
                      const isPrice = r.change_type === "price";
                      const isKm = r.change_type === "km";
                      const url = getSourceUrl(r);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{fmtDate(r.detected_at)}</TableCell>
                          <TableCell className="text-sm">{r.competitor_name}</TableCell>
                          <TableCell><ChangeTypeBadge type={r.change_type} /></TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {isKm
                              ? (r.previous_km?.toLocaleString("pt-BR") ?? "—")
                              : fmtBRL(r.previous_price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {isKm
                              ? (r.current_km?.toLocaleString("pt-BR") ?? "—")
                              : fmtBRL(r.current_price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {isPrice
                              ? `${fmtBRL(r.price_diff)} (${fmtPct(r.price_diff_pct)})`
                              : isKm && r.km_diff != null
                                ? `${r.km_diff > 0 ? "+" : ""}${r.km_diff.toLocaleString("pt-BR")} km`
                                : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                              >
                                Abrir <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
