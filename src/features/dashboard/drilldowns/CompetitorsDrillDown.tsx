import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { analyticsRepository } from "@/features/analytics/repositories/analytics.repository";
import { analyticsKeys } from "@/features/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/SearchInput";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Eye, Users } from "lucide-react";

const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("pt-BR") : "—";

/**
 * Drill-down "Concorrentes Monitorados".
 * Consome o Competitor Engine via analyticsRepository. Sem cálculos.
 */
export function CompetitorsDrillDown() {
  const [search, setSearch] = useState("");

  const competitorsQ = useQuery({
    queryKey: [...analyticsKeys.competitors(), "drill", "list"],
    queryFn: () => analyticsRepository.listCompetitors(),
    staleTime: 30_000,
  });
  const vehiclesQ = useQuery({
    queryKey: [...analyticsKeys.competitors(), "drill", "vehicles"],
    queryFn: () => analyticsRepository.listCompetitorVehicles(),
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const competitors = competitorsQ.data ?? [];
    const vehicles = vehiclesQ.data ?? [];
    const byId = new Map<string, { count: number; lastUpdate: string | null }>();
    const byName = new Map<string, { count: number; lastUpdate: string | null }>();
    for (const v of vehicles) {
      const updated = v.updated_at;
      if (v.competitor_id) {
        const cur = byId.get(v.competitor_id) ?? { count: 0, lastUpdate: null };
        cur.count += 1;
        if (!cur.lastUpdate || (updated && updated > cur.lastUpdate)) cur.lastUpdate = updated;
        byId.set(v.competitor_id, cur);
      } else if (v.competitor_name) {
        const cur = byName.get(v.competitor_name) ?? { count: 0, lastUpdate: null };
        cur.count += 1;
        if (!cur.lastUpdate || (updated && updated > cur.lastUpdate)) cur.lastUpdate = updated;
        byName.set(v.competitor_name, cur);
      }
    }
    const term = search.trim().toLowerCase();
    return competitors
      .map((c) => {
        const stats = byId.get(c.id) ?? byName.get(c.name) ?? { count: 0, lastUpdate: null };
        return { ...c, vehicleCount: stats.count, lastUpdate: stats.lastUpdate };
      })
      .filter((c) => !term || c.name.toLowerCase().includes(term));
  }, [competitorsQ.data, vehiclesQ.data, search]);

  if (competitorsQ.isLoading || vehiclesQ.isLoading) return <Skeleton className="h-64" />;
  if (competitorsQ.isError || vehiclesQ.isError)
    return (
      <ErrorState
        title="Falha ao carregar concorrentes"
        description={(competitorsQ.error as Error | undefined)?.message ?? "Tente novamente."}
        onRetry={() => {
          competitorsQ.refetch();
          vehiclesQ.refetch();
        }}
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar concorrente..."
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{rows.length} concorrente(s).</p>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum concorrente"
          description="Cadastre concorrentes para iniciar o monitoramento."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="w-[80px]">UF</TableHead>
                <TableHead className="w-[120px]">Site</TableHead>
                <TableHead className="w-[110px]">Veículos</TableHead>
                <TableHead className="w-[160px]">Última atualização</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.city ?? "—"}</TableCell>
                  <TableCell>{c.state ?? "—"}</TableCell>
                  <TableCell>
                    {c.url ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={c.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3" /> Abrir
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{c.vehicleCount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(c.lastUpdate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/concorrente/$id" params={{ id: c.id }}>
                        <Eye className="h-3 w-3" /> Abrir
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
