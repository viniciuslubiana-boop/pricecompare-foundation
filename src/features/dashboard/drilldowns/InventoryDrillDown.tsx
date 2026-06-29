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
import { Package, Pencil } from "lucide-react";
import { useActiveBaseCompanies } from "@/features/base-companies/hooks/useBaseCompanies";

const fmtMoney = (v: number | null | undefined) =>
  v == null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtKm = (v: number | null | undefined) =>
  v == null ? "—" : `${v.toLocaleString("pt-BR")} km`;

const ALL = "__all__";

interface Props {
  /** Filtro inicial de Empresa Base (mantém o escopo do Dashboard). */
  baseCompanyId?: string | null;
}

/**
 * Drill-down "Veículos Monitorados".
 * Consome diretamente o snapshot já cacheado do Analytics Engine — sem novo cálculo.
 */
export function InventoryDrillDown({ baseCompanyId = null }: Props) {
  const [companyFilter, setCompanyFilter] = useState<string>(baseCompanyId ?? ALL);
  const [brand, setBrand] = useState<string>(ALL);
  const [source, setSource] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  const scope = companyFilter === ALL ? null : companyFilter;
  const { data: companies = [] } = useActiveBaseCompanies();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...analyticsKeys.inventory(), "drill", scope ?? "all"],
    queryFn: () => analyticsRepository.listMyVehicles(scope),
    staleTime: 30_000,
  });

  const brands = useMemo(
    () => Array.from(new Set((data ?? []).map((v) => v.brand).filter(Boolean))).sort(),
    [data],
  );
  const sources = useMemo(
    () => Array.from(new Set((data ?? []).map((v) => v.source).filter(Boolean))).sort(),
    [data],
  );

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((v) => {
      if (brand !== ALL && v.brand !== brand) return false;
      if (source !== ALL && v.source !== source) return false;
      if (term && !`${v.brand} ${v.model}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, brand, source, search]);

  if (isLoading) return <Skeleton className="h-64" />;
  if (isError)
    return (
      <ErrorState
        title="Falha ao carregar veículos"
        description={(error as Error | undefined)?.message ?? "Tente novamente."}
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar marca ou modelo..."
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Empresa Base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as Empresas Base</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas marcas</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas fontes</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {rows.length} veículo(s) de {data?.length ?? 0} no escopo.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum veículo encontrado"
          description="Ajuste os filtros para visualizar veículos do estoque."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="w-[90px]">Ano</TableHead>
                <TableHead className="w-[110px]">KM</TableHead>
                <TableHead className="w-[130px]">Preço</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead className="w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.brand}</TableCell>
                  <TableCell>{v.model}</TableCell>
                  <TableCell>{v.year_model ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{fmtKm(v.km)}</TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {fmtMoney(v.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {v.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/veiculo/$id" params={{ id: v.id }}>
                        <Pencil className="h-3 w-3" /> Abrir
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
