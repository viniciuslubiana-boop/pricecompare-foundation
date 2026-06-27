import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Gauge,
} from "lucide-react";
import {
  useMarketChanges,
  useFilteredChanges,
  type MarketChangeRow,
} from "@/features/market-update";

export const Route = createFileRoute("/_authenticated/alteracoes-mercado")({
  head: () => ({
    meta: [
      { title: "Alterações do Mercado · PriceCompare" },
      {
        name: "description",
        content: "Veja exatamente o que mudou no mercado desde a última atualização.",
      },
    ],
  }),
  component: MarketChangesPage,
});

const fmtBRL = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

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
  tone?: "success" | "warning" | "danger" | "info";
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

function MarketChangesPage() {
  const [windowHours, setWindowHours] = useState<string>("24");
  const sinceHours = windowHours === "all" ? undefined : Number(windowHours);
  const { data, isLoading, isError, refetch } = useMarketChanges({ sinceHours });

  const competitors = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((r) => r.competitor_name && set.add(r.competitor_name));
    return Array.from(set).sort();
  }, [data]);

  const [competitor, setCompetitor] = useState<string>("all");
  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyRemoved, setOnlyRemoved] = useState(false);
  const [onlyPrice, setOnlyPrice] = useState(false);
  const [onlyAbove2, setOnlyAbove2] = useState(false);

  const filters = useMemo(
    () => ({
      competitorName: competitor === "all" ? null : competitor,
      onlyNew,
      onlyRemoved,
      onlyPrice,
      minPctAbs: onlyAbove2 ? 2 : null,
    }),
    [competitor, onlyNew, onlyRemoved, onlyPrice, onlyAbove2],
  );

  const { filtered, summary } = useFilteredChanges(data, filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alterações do Mercado"
        description="O que mudou, quem mudou, quanto mudou e quando — desde a última atualização."
      />

      {/* Indicadores */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Indicator label="Total de alterações" value={summary.total} tone="info" />
        <Indicator label="Novos veículos" value={summary.newVehicles} tone="success" />
        <Indicator label="Removidos" value={summary.removed} tone="danger" />
        <Indicator label="Preços reduzidos" value={summary.priceReduced} tone="success" />
        <Indicator label="Preços aumentados" value={summary.priceIncreased} tone="warning" />
        <Indicator label="Concorrentes" value={summary.totalCompetitors} />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={windowHours} onValueChange={setWindowHours}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="w-56"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {competitors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2"><Switch checked={onlyNew} onCheckedChange={setOnlyNew} id="f-new"/><Label htmlFor="f-new">Apenas novos</Label></div>
          <div className="flex items-center gap-2"><Switch checked={onlyRemoved} onCheckedChange={setOnlyRemoved} id="f-rem"/><Label htmlFor="f-rem">Apenas removidos</Label></div>
          <div className="flex items-center gap-2"><Switch checked={onlyPrice} onCheckedChange={setOnlyPrice} id="f-price"/><Label htmlFor="f-price">Apenas preços alterados</Label></div>
          <div className="flex items-center gap-2"><Switch checked={onlyAbove2} onCheckedChange={setOnlyAbove2} id="f-2pct"/><Label htmlFor="f-2pct">Apenas variação ≥ 2%</Label></div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Falha ao carregar alterações." onRetry={() => refetch()} />
          ) : !filtered.length ? (
            <EmptyState
              title="Nenhuma alteração encontrada"
              description="Execute uma atualização de mercado para detectar diferenças."
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
                    <TableHead>Resumo</TableHead>
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
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.detected_at)}</TableCell>
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
                        <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                          {r.summary}
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
    </div>
  );
}
