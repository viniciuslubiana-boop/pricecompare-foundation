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
import { Radar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRadar } from "../hooks/useRadar";
import type {
  CommercialPriority,
  RadarActionKind,
  RadarRow,
} from "../types/comparison.types";

const fmtMoney = (v: number | null | undefined) =>
  v == null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const PRIORITY_META: Record<
  CommercialPriority,
  { label: string; tone: string; dot: string }
> = {
  high: { label: "Alta", tone: "bg-destructive/15 text-destructive border-destructive/30", dot: "🔴" },
  medium: {
    label: "Média",
    tone: "bg-orange-500/15 text-orange-600 border-orange-500/40 dark:text-orange-400",
    dot: "🟠",
  },
  low: { label: "Baixa", tone: "bg-success/10 text-success border-success/30", dot: "🟢" },
  best_price: {
    label: "Melhor preço",
    tone: "bg-primary/15 text-primary border-primary/30",
    dot: "🔵",
  },
  none: { label: "Sem dados", tone: "bg-muted text-muted-foreground border-border", dot: "⚪" },
};

const ACTION_TONE: Record<RadarActionKind, string> = {
  review_today: "text-destructive",
  reduce: "text-destructive",
  follow_market: "text-warning",
  keep: "text-muted-foreground",
  excellent_position: "text-success",
  insufficient_data: "text-muted-foreground",
};

const ALL = "__all__";

interface Props {
  /** Quando true, oculta a busca e reduz a densidade (uso dentro do Dashboard) */
  compact?: boolean;
}

export function RadarPanel({ compact = false }: Props) {
  const { data, isLoading, isError, error, refetch, filters, setFilters, filteredRows } =
    useRadar();

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
        title="Falha ao carregar o Radar"
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
          label="Exigem ação hoje"
          value={String(summary.totalActionable)}
          tone="text-destructive"
          hint={`${summary.highCount} alta · ${summary.mediumCount} média`}
        />
        <SummaryCell
          label="Maior diferença"
          value={fmtMoney(summary.biggestDiffValue)}
          tone="text-warning"
          hint={summary.biggestDiffLabel ?? "—"}
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
          hint={`${summary.bestPriceCount} em melhor preço`}
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Toggle
              label="Alta prioridade"
              checked={!!filters.onlyHigh}
              onCheckedChange={(c) => patch({ onlyHigh: c })}
            />
            <Toggle
              label="Média prioridade"
              checked={!!filters.onlyMedium}
              onCheckedChange={(c) => patch({ onlyMedium: c })}
            />
            <Toggle
              label="Melhor preço"
              checked={!!filters.onlyBestPrice}
              onCheckedChange={(c) => patch({ onlyBestPrice: c })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="Nenhum veículo exige ação"
          description="Seu estoque está saudável ou ainda não há dados de mercado suficientes."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Prioridade</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="w-[90px]">Ano</TableHead>
                <TableHead className="w-[120px]">Seu preço</TableHead>
                <TableHead className="w-[120px]">Menor preço</TableHead>
                <TableHead className="w-[120px]">Preço médio</TableHead>
                <TableHead className="w-[110px]">Δ p/ menor</TableHead>
                <TableHead className="w-[100px]">Posição</TableHead>
                <TableHead className="w-[120px]">Competitividade</TableHead>
                <TableHead className="w-[200px]">Ação recomendada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r) => (
                <RadarRowItem key={r.id} row={r} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RadarRowItem({ row: r }: { row: RadarRow }) {
  const meta = PRIORITY_META[r.priority];
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
    <TableRow>
      <TableCell>
        <Badge variant="outline" className={cn("font-medium", meta.tone)}>
          <span className="mr-1">{meta.dot}</span>
          {meta.label}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{r.myVehicle.brand}</TableCell>
      <TableCell>{r.myVehicle.model}</TableCell>
      <TableCell>{r.myVehicle.year_model ?? "—"}</TableCell>
      <TableCell className="tabular-nums">{fmtMoney(r.myVehicle.price)}</TableCell>
      <TableCell className="tabular-nums">{fmtMoney(m.min)}</TableCell>
      <TableCell className="tabular-nums">{fmtMoney(m.avg)}</TableCell>
      <TableCell
        className={cn(
          "tabular-nums",
          m.diffFromMin != null && m.diffFromMin > 0 && "text-destructive",
          m.diffFromMin != null && m.diffFromMin <= 0 && "text-success",
        )}
      >
        {m.diffFromMin == null ? "—" : fmtMoney(m.diffFromMin)}
      </TableCell>
      <TableCell className="tabular-nums">
        {m.rankPosition == null ? "—" : `${m.rankPosition} / ${m.competitorCount + 1}`}
      </TableCell>
      <TableCell className={cn("font-semibold tabular-nums", compTone)}>
        {hasMarket ? `${m.competitiveness}%` : "—"}
      </TableCell>
      <TableCell className={cn("text-xs font-medium", ACTION_TONE[r.action.kind])}>
        {r.action.label}
      </TableCell>
    </TableRow>
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
