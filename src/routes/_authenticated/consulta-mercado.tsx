import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Loader2, Package, Search } from "lucide-react";
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
import { useGlobalSearch } from "@/features/comparison/hooks/useGlobalSearch";
import { applyVehicle360Filters } from "@/features/comparison/utils/vehicle360.filters";
import type {
  Vehicle360Filters,
  Vehicle360SortKey,
} from "@/features/comparison/types/comparison.types";
import type { GlobalSearchQuery } from "@/features/comparison/services/global-search.service";
import { formatBRL, formatKm } from "@/features/inventory/utils/inventory-formatters";

export const Route = createFileRoute("/_authenticated/consulta-mercado")({
  head: () => ({ meta: [{ title: "Consulta Global de Mercado · PriceCompare" }] }),
  component: GlobalMarketSearchPage,
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

function GlobalMarketSearchPage() {
  const [form, setForm] = useState<GlobalSearchQuery>({
    brand: "",
    model: "",
    version: "",
    year: "",
  });
  const [submitted, setSubmitted] = useState<GlobalSearchQuery | null>(null);
  const [filters, setFilters] = useState<Vehicle360Filters>({
    sameYear: true,
    sort: "price",
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useGlobalSearch(submitted);

  const filteredCompetitors = useMemo(() => {
    if (!data) return [];
    return applyVehicle360Filters(
      data.competitors,
      filters,
      data.myVehicle?.km ?? null,
    );
  }, [data, filters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand.trim() || !form.model.trim()) return;
    setSubmitted({ ...form });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consulta Global de Mercado"
        description="Pesquise qualquer veículo e veja em tempo real o que existe no mercado, suas estatísticas e o seu posicionamento."
      />

      {/* Formulário de busca */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 md:grid-cols-[1.2fr_1.5fr_1.2fr_0.8fr_auto] md:items-end"
          >
            <div className="space-y-1">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                placeholder="Ex.: Volkswagen"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                placeholder="Ex.: Polo"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="version">Versão</Label>
              <Input
                id="version"
                placeholder="Ex.: 1.0 Turbo"
                value={form.version ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                placeholder="Ex.: 2022"
                inputMode="numeric"
                value={form.year ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-1 h-4 w-4" />
              )}
              Consultar
            </Button>
          </form>
        </CardContent>
      </Card>

      {!submitted && (
        <EmptyState
          title="Pesquise um veículo"
          description="Informe ao menos a Marca e o Modelo para consultar o mercado."
        />
      )}

      {submitted && isLoading && (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Consultando mercado…
        </div>
      )}

      {submitted && isError && (
        <ErrorState
          title="Falha ao consultar o mercado"
          description={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      )}

      {submitted && data && (
        <>
          {/* MEU VEÍCULO */}
          {data.myVehicle ? (
            <Card>
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                      Meu Veículo · {data.myVehicle.brand}
                    </div>
                    <h2 className="text-xl font-semibold leading-tight">
                      {data.myVehicle.model}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{data.myVehicle.year_model}</Badge>
                      <span>•</span>
                      <span>{formatKm(data.myVehicle.km)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Meu preço</div>
                    <div className="text-2xl font-bold tabular-nums">
                      {data.myVehicle.price != null
                        ? formatBRL(data.myVehicle.price as unknown as number)
                        : "—"}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/veiculo/$id" params={{ id: data.myVehicle.id }}>
                      Abrir Visão 360°
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Nenhum veículo do seu estoque corresponde a esta busca. Exibindo apenas o painel
                de mercado.
              </CardContent>
            </Card>
          )}

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Encontrados" value={String(data.market.competitorCount)} />
            <StatCard
              label="Menor preço"
              value={data.market.min != null ? formatBRL(data.market.min) : "—"}
              tone="success"
            />
            <StatCard
              label="Maior preço"
              value={data.market.max != null ? formatBRL(data.market.max) : "—"}
            />
            <StatCard
              label="Preço médio"
              value={data.market.avg != null ? formatBRL(data.market.avg) : "—"}
            />
            <StatCard
              label="Minha posição"
              value={
                data.market.rankPosition != null
                  ? `${data.market.rankPosition} / ${data.market.competitorCount + 1}`
                  : "—"
              }
              tone={
                data.market.competitiveness >= 80
                  ? "success"
                  : data.market.competitiveness >= 60
                    ? "warning"
                    : "danger"
              }
            />
          </div>

          {/* FILTROS */}
          <Card>
            <CardContent className="grid gap-4 p-4 md:grid-cols-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <Label>Mesmo ano</Label>
                  <p className="text-xs text-muted-foreground">Pelo Engine</p>
                </div>
                <Switch checked={!!filters.sameYear} disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="versao">Mesma versão</Label>
                <Input
                  id="versao"
                  placeholder="Ex.: Turbo"
                  value={filters.versionTerm ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, versionTerm: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fuel">Combustível</Label>
                <Input id="fuel" placeholder="Indisponível" disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gear">Câmbio</Label>
                <Input id="gear" placeholder="Indisponível" disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" placeholder="Indisponível" disabled />
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

          {/* MERCADO */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <h3 className="text-sm font-semibold">Mercado · anúncios equivalentes</h3>
                  <p className="text-xs text-muted-foreground">
                    Exibindo {filteredCompetitors.length} de {data.competitors.length}{" "}
                    anúncio(s), do menor para o maior preço.
                  </p>
                </div>
              </div>
              {filteredCompetitors.length === 0 ? (
                <EmptyState
                  title="Nenhum anúncio equivalente"
                  description="Nenhum concorrente possui um veículo equivalente a esta busca — ou os filtros estão muito restritivos."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loja</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Ano</TableHead>
                        <TableHead className="text-right">KM</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Δ vs meu</TableHead>
                        <TableHead>Data da coleta</TableHead>
                        <TableHead className="w-[120px] text-right">Anúncio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompetitors.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.store}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {c.city ?? "—"}
                          </TableCell>
                          <TableCell>{c.yearModel}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatKm(c.km)}
                          </TableCell>
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

          {/* HISTÓRICO */}
          {data.history.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="border-b p-4">
                  <h3 className="text-sm font-semibold">Histórico de preços do mercado</h3>
                  <p className="text-xs text-muted-foreground">
                    Alterações capturadas nas execuções de Atualizar Mercado.
                  </p>
                </div>
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
                            {h.diff == null
                              ? "—"
                              : `${formatBRL(h.diff)} (${fmtPct(h.diffPct)})`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
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
