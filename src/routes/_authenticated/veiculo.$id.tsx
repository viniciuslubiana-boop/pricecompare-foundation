import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Loader2, Package } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";
import { useVehicle360 } from "@/features/comparison/hooks/useVehicle360";
import { applyVehicle360Filters } from "@/features/comparison/utils/vehicle360.filters";
import type {
  Vehicle360Filters,
  Vehicle360SortKey,
} from "@/features/comparison/types/comparison.types";
import { formatBRL, formatKm } from "@/features/inventory/utils/inventory-formatters";

export const Route = createFileRoute("/_authenticated/veiculo/$id")({
  head: () => ({ meta: [{ title: "Visão 360° · PriceCompare" }] }),
  component: Vehicle360Page,
});

const fmtPct = (v: number | null) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

function Vehicle360Page() {
  const { id } = Route.useParams();
  const { data, isLoading, isError, error, refetch } = useVehicle360(id);
  const [filters, setFilters] = useState<Vehicle360Filters>({
    sameYear: true,
    sort: "price",
  });

  const filteredCompetitors = useMemo(() => {
    if (!data) return [];
    return applyVehicle360Filters(data.competitors, filters, data.myVehicle.km ?? null);
  }, [data, filters]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando visão 360°…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Não foi possível carregar a visão 360°"
        description={(error as Error)?.message}
        onRetry={() => refetch()}
      />
    );
  }

  const v = data.myVehicle;
  const m = data.market;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão 360° do Veículo"
        description="Situação completa deste veículo no mercado em um único painel."
        actions={
          <Button variant="outline" asChild>
            <Link to="/comparar">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      {/* Painel Superior */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {v.brand}
              </div>
              <h2 className="text-xl font-semibold leading-tight">{v.model}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{v.year_model}</Badge>
                <span>•</span>
                <span>{formatKm(v.km)}</span>
                {v.supplier_name ? (
                  <>
                    <span>•</span>
                    <span>{v.supplier_name}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-muted-foreground">Seu preço</div>
            <div className="text-2xl font-bold tabular-nums">
              {formatBRL(v.price as unknown as number)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Painel Estatísticas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Concorrentes" value={String(m.competitorCount)} />
        <StatCard label="Menor preço" value={m.min != null ? formatBRL(m.min) : "—"} tone="success" />
        <StatCard label="Maior preço" value={m.max != null ? formatBRL(m.max) : "—"} />
        <StatCard label="Preço médio" value={m.avg != null ? formatBRL(m.avg) : "—"} />
        <StatCard
          label="Sua posição"
          value={
            m.rankPosition != null
              ? `${m.rankPosition} / ${m.competitorCount + 1}`
              : "—"
          }
          tone={m.competitiveness >= 80 ? "success" : m.competitiveness >= 60 ? "warning" : "danger"}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <div className="flex items-center justify-between gap-3 md:col-span-1">
            <div className="space-y-1">
              <Label>Mesmo ano</Label>
              <p className="text-xs text-muted-foreground">Equivalentes do Engine</p>
            </div>
            <Switch
              checked={!!filters.sameYear}
              onCheckedChange={(v) => setFilters((f) => ({ ...f, sameYear: v }))}
              disabled
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="versao">Mesma versão (contém)</Label>
            <Input
              id="versao"
              placeholder="Ex.: 1.0 Turbo"
              value={filters.versionTerm ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, versionTerm: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kmdist">Até X km de distância</Label>
            <Input
              id="kmdist"
              type="number"
              min={0}
              placeholder="Ex.: 20000"
              value={filters.maxKmDistance ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  maxKmDistance: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Ordenar por</Label>
            <Select
              value={filters.sort ?? "price"}
              onValueChange={(val) =>
                setFilters((f) => ({ ...f, sort: val as Vehicle360SortKey }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Preço</SelectItem>
                <SelectItem value="km">KM</SelectItem>
                <SelectItem value="date">Data da coleta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Painel Mercado */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="text-sm font-semibold">Mercado · concorrentes equivalentes</h3>
              <p className="text-xs text-muted-foreground">
                Exibindo {filteredCompetitors.length} de {data.competitors.length} concorrente(s).
              </p>
            </div>
          </div>
          {filteredCompetitors.length === 0 ? (
            <EmptyState
              title="Nenhum concorrente equivalente"
              description="Nenhum concorrente cadastrado possui um veículo equivalente a este — ou os filtros estão muito restritivos."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Ano/Modelo</TableHead>
                    <TableHead className="text-right">KM</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Δ vs meu</TableHead>
                    <TableHead>Última coleta</TableHead>
                    <TableHead className="w-[120px] text-right">Anúncio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompetitors.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.store}</TableCell>
                      <TableCell className="text-muted-foreground">{c.city ?? "—"}</TableCell>
                      <TableCell>{c.yearModel}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKm(c.km)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatBRL(c.price)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          c.diffFromMe != null && c.diffFromMe < 0 && "text-destructive",
                          c.diffFromMe != null && c.diffFromMe > 0 && "text-success",
                        )}
                      >
                        {c.diffFromMe == null
                          ? "—"
                          : `${formatBRL(c.diffFromMe)} (${fmtPct(c.diffPctFromMe)})`}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {fmtDate(c.lastCollectedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.sourceUrl || c.competitorUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={c.sourceUrl ?? c.competitorUrl ?? "#"}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              Abrir <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel Histórico */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4">
            <h3 className="text-sm font-semibold">Histórico de preços do mercado</h3>
            <p className="text-xs text-muted-foreground">
              Alterações capturadas nas execuções de Atualizar Mercado.
            </p>
          </div>
          {data.history.length === 0 ? (
            <EmptyState
              title="Sem histórico ainda"
              description="Nenhuma alteração de preço foi detectada para este veículo até o momento."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Concorrente</TableHead>
                    <TableHead className="text-right">Preço anterior</TableHead>
                    <TableHead className="text-right">Preço atual</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(h.detectedAt)}
                      </TableCell>
                      <TableCell>{h.competitorName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {h.previousPrice != null ? formatBRL(h.previousPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {h.currentPrice != null ? formatBRL(h.currentPrice) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          h.diff != null && h.diff < 0 && "text-success",
                          h.diff != null && h.diff > 0 && "text-destructive",
                        )}
                      >
                        {h.diff == null ? "—" : `${formatBRL(h.diff)} (${fmtPct(h.diffPct)})`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div
          className={cn(
            "mt-1 text-lg font-semibold tabular-nums",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "danger" && "text-destructive",
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
