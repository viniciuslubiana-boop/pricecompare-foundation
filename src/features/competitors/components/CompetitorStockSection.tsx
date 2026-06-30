import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileSpreadsheet, Package } from "lucide-react";
import { competitorVehicleRepository } from "@/features/extraction/repositories/competitor-vehicle.repository";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { SearchInput } from "@/components/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadVehiclesCsv, downloadVehiclesXlsx, type ExportVehicleRow } from "@/lib/export-vehicles";

const fmtPrice = (v: number | null | undefined) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "—";

const fmtKm = (v: number | null | undefined) =>
  typeof v === "number" ? `${v.toLocaleString("pt-BR")} km` : "—";

const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("pt-BR") : "—";

interface Props {
  competitorId: string;
}

export function CompetitorStockSection({ competitorId }: Props) {
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["competitor-vehicles", competitorId],
    queryFn: () => competitorVehicleRepository.listByCompetitor(competitorId),
    enabled: !!competitorId,
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const list = q.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((v) =>
      [v.brand, v.model, v.version, v.year_model, v.city]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(term)),
    );
  }, [q.data, search]);

  const lastUpdate = useMemo(() => {
    const list = q.data ?? [];
    return list.reduce<string | null>((acc, v) => {
      const u = v.updated_at ?? v.created_at;
      if (!acc || (u && u > acc)) return u;
      return acc;
    }, null);
  }, [q.data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Estoque atualizado</CardTitle>
            <CardDescription>
              Veículos capturados deste concorrente.{" "}
              {q.data ? (
                <>
                  Total: <strong>{q.data.length}</strong> · Última atualização:{" "}
                  {fmtDate(lastUpdate)}
                </>
              ) : null}
            </CardDescription>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo, ano..."
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : q.isError ? (
          <ErrorState
            title="Falha ao carregar estoque"
            description={(q.error as Error)?.message}
            onRetry={() => q.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              q.data && q.data.length > 0
                ? "Nenhum veículo corresponde à busca"
                : "Sem estoque sincronizado"
            }
            description={
              q.data && q.data.length > 0
                ? "Ajuste o termo de busca."
                : "Execute uma sincronização ou importação para popular o estoque deste concorrente."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead className="w-[90px]">Ano</TableHead>
                  <TableHead className="w-[120px]">KM</TableHead>
                  <TableHead className="w-[130px]">Preço</TableHead>
                  <TableHead className="w-[140px]">Cidade</TableHead>
                  <TableHead className="w-[160px]">Atualizado</TableHead>
                  <TableHead className="w-[80px]">Fonte</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.brand ?? "—"}</TableCell>
                    <TableCell>{v.model ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.version ?? "—"}</TableCell>
                    <TableCell>{v.year_model ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{fmtKm(v.km)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{fmtPrice(v.price)}</TableCell>
                    <TableCell>{v.city ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(v.updated_at ?? v.created_at)}
                    </TableCell>
                    <TableCell>
                      {v.source ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {v.source}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.source_url ? (
                        <a
                          href={v.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          aria-label="Abrir anúncio"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
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
  );
}
