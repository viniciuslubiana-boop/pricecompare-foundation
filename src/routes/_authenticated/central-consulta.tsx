import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  ExternalLink,
  GitCompareArrows,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/features/comparison/hooks/useGlobalSearch";
import type { GlobalSearchQuery } from "@/features/comparison/services/global-search.service";
import type { Vehicle360CompetitorEntry } from "@/features/comparison/types/comparison.types";
import { formatBRL, formatKm } from "@/features/inventory/utils/inventory-formatters";

export const Route = createFileRoute("/_authenticated/central-consulta")({
  head: () => ({
    meta: [
      { title: "Central de Consulta de Mercado · PriceCompare" },
      {
        name: "description",
        content:
          "Consulte qualquer veículo em uma única tela: meu estoque, mercado, estatísticas e histórico.",
      },
    ],
  }),
  component: CentralConsultaPage,
});

/* ─────────────── Parser do campo único ─────────────── */
function parseSearch(raw: string): GlobalSearchQuery | null {
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) return null;
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? "";
  const withoutYear = (yearMatch ? text.replace(yearMatch[0], "") : text)
    .replace(/\s+/g, " ")
    .trim();
  const tokens = withoutYear.split(" ").filter(Boolean);
  if (tokens.length < 2) return null;
  const [brand, model, ...rest] = tokens;
  return {
    brand,
    model,
    version: rest.join(" ") || undefined,
    year: year || undefined,
  };
}

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

interface AdvancedFilters {
  city: string;
  state: string;
  competitor: string; // "all" | name
  source: string; // "all" | host
  minPrice: string;
  maxPrice: string;
  minKm: string;
  maxKm: string;
  year: string; // "all" | yyyy
}

const initialFilters: AdvancedFilters = {
  city: "",
  state: "",
  competitor: "all",
  source: "all",
  minPrice: "",
  maxPrice: "",
  minKm: "",
  maxKm: "",
  year: "all",
};

function applyClientFilters(
  rows: Vehicle360CompetitorEntry[],
  f: AdvancedFilters,
): Vehicle360CompetitorEntry[] {
  const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
  const minP = f.minPrice ? Number(f.minPrice) : null;
  const maxP = f.maxPrice ? Number(f.maxPrice) : null;
  const minK = f.minKm ? Number(f.minKm) : null;
  const maxK = f.maxKm ? Number(f.maxKm) : null;
  const cityQ = norm(f.city);
  const stateQ = norm(f.state);
  return rows.filter((r) => {
    if (cityQ && !norm(r.city).includes(cityQ)) return false;
    if (stateQ && !norm(r.state).includes(stateQ)) return false;
    if (f.competitor !== "all" && r.competitorName !== f.competitor) return false;
    if (f.source !== "all" && (r.source ?? "") !== f.source) return false;
    if (minP != null && r.price < minP) return false;
    if (maxP != null && r.price > maxP) return false;
    if (minK != null && (r.km == null || r.km < minK)) return false;
    if (maxK != null && (r.km == null || r.km > maxK)) return false;
    if (f.year !== "all" && r.yearModel !== f.year) return false;
    return true;
  });
}

function toCsv(rows: Vehicle360CompetitorEntry[]): string {
  const header = [
    "Loja",
    "Cidade",
    "Estado",
    "Fonte",
    "Ano/Modelo",
    "KM",
    "Preço",
    "Δ vs meu",
    "Data da coleta",
    "Link",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) =>
    [
      r.store,
      r.city ?? "",
      r.state ?? "",
      r.source ?? "",
      r.yearModel,
      r.km ?? "",
      r.price,
      r.diffFromMe ?? "",
      r.lastCollectedAt,
      r.sourceUrl ?? r.competitorUrl ?? "",
    ]
      .map(escape)
      .join(";"),
  );
  return [header.join(";"), ...body].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CentralConsultaPage() {
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState<GlobalSearchQuery | null>(null);
  const [filters, setFilters] = useState<AdvancedFilters>(initialFilters);

  const { data, isLoading, isError, error, refetch, isFetching } = useGlobalSearch(submitted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSearch(term);
    if (!parsed) return;
    setSubmitted(parsed);
  };

  const competitorOptions = useMemo(() => {
    const set = new Set<string>();
    (data?.competitors ?? []).forEach((c) => set.add(c.competitorName));
    return Array.from(set).sort();
  }, [data]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    (data?.competitors ?? []).forEach((c) => c.source && set.add(c.source));
    return Array.from(set).sort();
  }, [data]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    (data?.competitors ?? []).forEach((c) => c.yearModel && set.add(c.yearModel));
    return Array.from(set).sort();
  }, [data]);

  const filteredCompetitors = useMemo(
    () => (data ? applyClientFilters(data.competitors, filters) : []),
    [data, filters],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.city) n++;
    if (filters.state) n++;
    if (filters.competitor !== "all") n++;
    if (filters.source !== "all") n++;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    if (filters.minKm) n++;
    if (filters.maxKm) n++;
    if (filters.year !== "all") n++;
    return n;
  }, [filters]);

  const exportCsv = () => {
    if (!data) return;
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const slug =
      [submitted?.brand, submitted?.model, submitted?.year].filter(Boolean).join("-") || "consulta";
    downloadCsv(`central-consulta-${slug}-${ts}.csv`, toCsv(filteredCompetitors));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Consulta de Mercado"
        description="Pesquise qualquer veículo (marca, modelo, versão, ano) e veja em uma única tela seu estoque, o mercado, estatísticas e histórico."
      />

      {/* Campo de pesquisa único */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="q">Pesquisa</Label>
              <Input
                id="q"
                placeholder='Ex.: "Volkswagen Polo 1.0 Turbo 2022"'
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Informe marca + modelo. Versão e ano (4 dígitos) são opcionais.
              </p>
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
          description="Digite ao menos a Marca e o Modelo para iniciar a consulta."
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
          {/* PAINEL 1 — MEU VEÍCULO */}
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
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/veiculo/$id" params={{ id: data.myVehicle.id }}>
                        Visão 360°
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/comparar">
                        <GitCompareArrows className="mr-1 h-4 w-4" /> Abrir comparação
                      </Link>
                    </Button>
                  </div>
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

          {/* PAINEL 3 — ESTATÍSTICAS */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <StatCard label="Anúncios" value={String(data.market.competitorCount)} />
            <StatCard
              label="Concorrentes"
              value={String(competitorOptions.length)}
            />
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
            <CardContent className="grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-1">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="Ex.: São Paulo"
                  value={filters.city}
                  onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="Ex.: SP"
                  value={filters.state}
                  onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Concorrente</Label>
                <Select
                  value={filters.competitor}
                  onValueChange={(v) => setFilters((f) => ({ ...f, competitor: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {competitorOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fonte</Label>
                <Select
                  value={filters.source}
                  onValueChange={(v) => setFilters((f) => ({ ...f, source: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {sourceOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ano</Label>
                <Select
                  value={filters.year}
                  onValueChange={(v) => setFilters((f) => ({ ...f, year: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Preço mín.</Label>
                <Input
                  inputMode="numeric"
                  placeholder="R$"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Preço máx.</Label>
                <Input
                  inputMode="numeric"
                  placeholder="R$"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>KM mín.</Label>
                <Input
                  inputMode="numeric"
                  value={filters.minKm}
                  onChange={(e) => setFilters((f) => ({ ...f, minKm: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>KM máx.</Label>
                <Input
                  inputMode="numeric"
                  value={filters.maxKm}
                  onChange={(e) => setFilters((f) => ({ ...f, maxKm: e.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(initialFilters)}
                  disabled={activeFilterCount === 0}
                >
                  <X className="mr-1 h-4 w-4" /> Limpar ({activeFilterCount})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PAINEL 2 — MERCADO CONSOLIDADO */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-2 border-b p-4">
                <div>
                  <h3 className="text-sm font-semibold">Mercado consolidado</h3>
                  <p className="text-xs text-muted-foreground">
                    Exibindo {filteredCompetitors.length} de {data.competitors.length}{" "}
                    anúncio(s), ordenados do menor para o maior preço.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportCsv}
                    disabled={filteredCompetitors.length === 0}
                  >
                    <Download className="mr-1 h-4 w-4" /> Exportar consulta
                  </Button>
                </div>
              </div>
              {filteredCompetitors.length === 0 ? (
                <EmptyState
                  title="Nenhum anúncio equivalente"
                  description="Nenhum concorrente possui um veículo equivalente — ou os filtros estão muito restritivos."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loja</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Ano/Modelo</TableHead>
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
                            {c.city ? `${c.city}${c.state ? `/${c.state}` : ""}` : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {c.source ?? "—"}
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

          {/* PAINEL 4 — HISTÓRICO */}
          <Card>
            <CardContent className="p-0">
              <div className="border-b p-4">
                <h3 className="text-sm font-semibold">Histórico de preços do veículo</h3>
                <p className="text-xs text-muted-foreground">
                  Alterações capturadas nas execuções de Atualizar Mercado.
                </p>
              </div>
              {data.history.length === 0 ? (
                <EmptyState
                  title="Sem histórico"
                  description="Não há alterações registradas para este veículo nas execuções recentes."
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
                            {h.diff == null
                              ? "—"
                              : `${formatBRL(h.diff)} (${fmtPct(h.diffPct)})`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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
  const toneClass =
    tone === "success"
      ? "text-emerald-500"
      : tone === "warning"
        ? "text-amber-500"
        : tone === "danger"
          ? "text-red-500"
          : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-xl font-semibold tabular-nums", toneClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}
