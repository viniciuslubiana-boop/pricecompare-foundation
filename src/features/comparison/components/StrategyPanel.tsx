import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/SearchInput";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { PositionDrillDown } from "@/features/dashboard/drilldowns/PositionDrillDown";
import { ChevronDown, ChevronRight, RefreshCw, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStrategy } from "../hooks/useStrategy";
import type {
  StrategyRecommendationKind,
  StrategyRow,
  StrategySortKey,
} from "../types/comparison.types";

const fmtMoney = (v: number | null | undefined) =>
  v == null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const RECO_META: Record<
  StrategyRecommendationKind,
  { tone: string; dot: string }
> = {
  keep: { tone: "bg-success/10 text-success border-success/30", dot: "🟢" },
  reduce: { tone: "bg-destructive/15 text-destructive border-destructive/30", dot: "🔴" },
  excellent_position: { tone: "bg-primary/15 text-primary border-primary/30", dot: "🔵" },
  market_up: { tone: "bg-warning/15 text-warning border-warning/30", dot: "📈" },
  market_down: { tone: "bg-warning/15 text-warning border-warning/30", dot: "📉" },
  insufficient_data: { tone: "bg-muted text-muted-foreground border-border", dot: "⚪" },
};

const ALL = "__all__";

interface Props {
  /** Quando true, oculta a busca e reduz a densidade (uso dentro do Dashboard) */
  compact?: boolean;
}

export function StrategyPanel({ compact = false }: Props) {
  const { data, isLoading, isError, error, refetch, filters, setFilters, filteredRows } =
    useStrategy();
  const patch = (p: Partial<typeof filters>) => setFilters({ ...filters, ...p });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Falha ao carregar a Estratégia"
        description={(error as Error | undefined)?.message ?? "Tente novamente."}
        onRetry={() => refetch()}
      />
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCell
          label="Veículos com recomendação"
          value={String(summary.totalWithRecommendation)}
          tone="text-primary"
          hint={`${summary.reduceCount} reduzir · ${summary.keepCount} manter · ${summary.excellentCount} excelente`}
        />
        <SummaryCell
          label="Redução sugerida total"
          value={fmtMoney(summary.totalSuggestedReduction)}
          tone="text-destructive"
          hint="Soma das recomendações de redução"
        />
        <SummaryCell
          label="Maior oportunidade"
          value={fmtMoney(summary.biggestOpportunityValue)}
          tone="text-destructive"
          hint={summary.biggestOpportunityLabel ?? "—"}
        />
        <SummaryCell
          label="Competitividade média"
          value={`${summary.avgCompetitiveness}%`}
          tone={
            summary.avgCompetitiveness >= 80
              ? "text-success"
              : summary.avgCompetitiveness >= 60
                ? "text-warning"
                : "text-destructive"
          }
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            {!compact && (
              <div className="min-w-[220px] flex-1">
                <Label className="mb-1 block text-xs">Buscar</Label>
                <SearchInput
                  value={filters.search ?? ""}
                  onChange={(e) => patch({ search: e.target.value })}
                  placeholder="Marca ou modelo..."
                />
              </div>
            )}
            <div className="min-w-[180px]">
              <Label className="mb-1 block text-xs">Ordenar por</Label>
              <Select
                value={filters.sort ?? "max_impact"}
                onValueChange={(v) => patch({ sort: v as StrategySortKey })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="max_impact">Maior impacto</SelectItem>
                  <SelectItem value="suggested_reduction">Redução sugerida</SelectItem>
                  <SelectItem value="best_opportunity">Melhor oportunidade</SelectItem>
                  <SelectItem value="none">Sem ordenação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <Label className="mb-1 block text-xs">Marca</Label>
              <Select
                value={filters.brand ?? ALL}
                onValueChange={(v) => patch({ brand: v === ALL ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {data.brands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <Label className="mb-1 block text-xs">Concorrente</Label>
              <Select
                value={filters.competitorName ?? ALL}
                onValueChange={(v) => patch({ competitorName: v === ALL ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {data.competitors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Toggle
              label="Somente redução sugerida"
              checked={!!filters.onlyReduce}
              onCheckedChange={(c) => patch({ onlyReduce: c })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum veículo com recomendação"
          description="Atualize o mercado ou ajuste os filtros para visualizar recomendações."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32px]"></TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead className="w-[120px]">Seu preço</TableHead>
                <TableHead className="w-[120px]">Menor</TableHead>
                <TableHead className="w-[120px]">Médio</TableHead>
                <TableHead className="w-[100px]">Posição</TableHead>
                <TableHead className="w-[120px]">Competitividade</TableHead>
                <TableHead className="w-[220px]">Recomendação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r) => (
                <StrategyRowItem key={r.id} row={r} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StrategyRowItem({ row: r }: { row: StrategyRow }) {
  const [open, setOpen] = useState(false);
  const [openPos, setOpenPos] = useState(false);
  const meta = RECO_META[r.recommendation.kind];
  const m = r.market;
  const hasMarket = m.competitorCount > 0;
  const compTone = !hasMarket
    ? "text-muted-foreground"
    : m.competitiveness >= 80
      ? "text-success"
      : m.competitiveness >= 60
        ? "text-warning"
        : "text-destructive";

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <TableCell>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>
          <div className="font-medium">{r.myVehicle.brand} {r.myVehicle.model}</div>
          <div className="text-xs text-muted-foreground">{r.myVehicle.year_model ?? "—"}</div>
        </TableCell>
        <TableCell className="tabular-nums">{fmtMoney(r.myVehicle.price)}</TableCell>
        <TableCell className="tabular-nums">{fmtMoney(m.min)}</TableCell>
        <TableCell className="tabular-nums">{fmtMoney(m.avg)}</TableCell>
        <TableCell className="tabular-nums">
          {m.rankPosition == null ? "—" : `${m.rankPosition} / ${m.competitorCount + 1}`}
        </TableCell>
        <TableCell className={cn("font-semibold tabular-nums", compTone)}>
          {hasMarket ? `${m.competitiveness}%` : "—"}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("font-medium", meta.tone)}>
            <span className="mr-1">{meta.dot}</span>
            {r.recommendation.label}
          </Badge>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} className="p-0">
          <Collapsible open={open}>
            <CollapsibleTrigger asChild>
              <span className="sr-only">Detalhes</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{r.recommendation.impact}</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  {r.scenarios.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "rounded-md border bg-background p-3",
                        !s.applicable && "opacity-50",
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-destructive">
                        − {fmtMoney(s.reduction)}
                      </p>
                      <p className="mt-1 text-xs">
                        Novo preço:{" "}
                        <span className="font-medium tabular-nums">{fmtMoney(s.newPrice)}</span>
                      </p>
                      <p className="text-xs">
                        Nova posição:{" "}
                        <span className="font-medium tabular-nums">
                          {s.newRank == null ? "—" : `${s.newRank} / ${s.totalRanked}`}
                        </span>
                      </p>
                      {s.becomesBestPrice && (
                        <Badge
                          variant="outline"
                          className="mt-2 border-primary/30 bg-primary/10 text-primary"
                        >
                          Melhor preço
                        </Badge>
                      )}
                      {!s.becomesBestPrice && s.positionsGained > 0 && (
                        <p className="mt-2 text-xs text-success">
                          +{s.positionsGained} posição(ões)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    </>
  );
}

function SummaryCell({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone)}>{value}</p>
        {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
