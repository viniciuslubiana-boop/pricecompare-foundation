import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CompetitorVehicle,
  MarketIntelligence,
  MyVehicle,
} from "@/features/comparison/types/comparison.types";

const fmtMoney = (v: number | null | undefined) =>
  v == null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtKm = (v: number | null | undefined) =>
  v == null ? "—" : `${v.toLocaleString("pt-BR")} km`;
const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString("pt-BR") : "—";

interface Props {
  myVehicle: MyVehicle;
  market: MarketIntelligence;
  equivalents: CompetitorVehicle[];
}

/**
 * Drill-down "Posição no Mercado".
 * Consome exclusivamente dados já produzidos pelos Engines (Comparison + Analytics).
 * Nenhum cálculo é feito aqui — apenas ordenação local para exibir o ranking.
 */
export function PositionDrillDown({ myVehicle, market, equivalents }: Props) {
  const myPrice = myVehicle.price ?? null;

  // Monta a lista do ranking: meu veículo + concorrentes equivalentes
  const items: Array<
    | { kind: "me"; price: number | null; vehicle: MyVehicle }
    | { kind: "competitor"; price: number | null; vehicle: CompetitorVehicle }
  > = [
    { kind: "me", price: myPrice, vehicle: myVehicle },
    ...equivalents.map(
      (v) => ({ kind: "competitor" as const, price: v.price ?? null, vehicle: v }),
    ),
  ];

  // Apenas ordenação (não recalcula métricas)
  items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Menor preço" value={fmtMoney(market.min)} tone="text-success" />
        <Stat label="Maior preço" value={fmtMoney(market.max)} tone="text-destructive" />
        <Stat label="Preço médio" value={fmtMoney(market.avg)} />
        <Stat
          label="Minha posição"
          value={
            market.rankPosition == null
              ? "—"
              : `${market.rankPosition} / ${market.competitorCount + 1}`
          }
          tone="text-primary"
        />
        <Stat label="Concorrentes" value={String(market.competitorCount)} />
      </div>

      {items.length <= 1 ? (
        <EmptyState
          icon={Trophy}
          title="Sem concorrentes equivalentes"
          description="Ainda não há veículos de mercado iguais a este (mesma marca, modelo e ano)."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Posição</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead className="w-[90px]">Ano</TableHead>
                <TableHead className="w-[110px]">KM</TableHead>
                <TableHead className="w-[130px]">Preço</TableHead>
                <TableHead className="w-[130px]">Diferença</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead className="w-[110px]">Coleta</TableHead>
                <TableHead className="w-[110px]">Anúncio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => {
                const isMe = item.kind === "me";
                const diff =
                  !isMe && myPrice != null && item.price != null ? item.price - myPrice : null;
                const v = item.vehicle;
                const isCompetitor = item.kind === "competitor";
                const cv = isCompetitor ? (v as CompetitorVehicle) : null;
                const mv = !isCompetitor ? (v as MyVehicle) : null;
                return (
                  <TableRow key={`${item.kind}-${v.id}`} className={cn(isMe && "bg-primary/5")}>
                    <TableCell className="font-semibold tabular-nums">{idx + 1}º</TableCell>
                    <TableCell>
                      {isMe ? (
                        <Badge className="bg-primary text-primary-foreground">MEU VEÍCULO</Badge>
                      ) : (
                        <span className="font-medium">{cv?.competitor_name ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isMe ? "—" : (cv?.city ?? "—")}
                    </TableCell>
                    <TableCell>{v.brand}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isCompetitor ? (cv?.version ?? "—") : "—"}
                    </TableCell>
                    <TableCell>{v.year_model ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{fmtKm(v.km)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {fmtMoney(item.price)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular-nums",
                        diff != null && diff > 0 && "text-success",
                        diff != null && diff < 0 && "text-destructive",
                      )}
                    >
                      {isMe ? "—" : diff == null ? "—" : fmtMoney(diff)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isMe ? (mv?.source ?? "Estoque") : (cv?.source ?? "—")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {isMe ? "—" : fmtDate(cv?.updated_at)}
                    </TableCell>
                    <TableCell>
                      {isCompetitor && cv?.source_url ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={cv.source_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3 w-3" /> Abrir
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-lg font-semibold tabular-nums", tone)}>{value}</p>
      </CardContent>
    </Card>
  );
}
