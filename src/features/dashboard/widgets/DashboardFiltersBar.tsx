import { Building2, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveBaseCompanies } from "@/features/base-companies/hooks/useBaseCompanies";
import { useCompetitors } from "@/features/competitors/hooks/useCompetitors";
import type { DashboardFilters, DashboardPeriod } from "../preferences/types";

interface Props {
  baseCompanyId: string | null;
  onBaseCompanyChange: (id: string | null) => void;
  filters: DashboardFilters;
  onFiltersChange: (patch: Partial<DashboardFilters>) => void;
  onReset: () => void;
}

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "all", label: "Tudo" },
];

export function DashboardFiltersBar({
  baseCompanyId,
  onBaseCompanyChange,
  filters,
  onFiltersChange,
  onReset,
}: Props) {
  const { data: companies = [] } = useActiveBaseCompanies();
  const { data: competitors = [] } = useCompetitors();

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />

        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={baseCompanyId ?? "__all__"}
            onValueChange={(v) => onBaseCompanyChange(v === "__all__" ? null : v)}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Empresa Base" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as Empresas Base</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={filters.period}
          onValueChange={(v) => onFiltersChange({ period: v as DashboardPeriod })}
        >
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={filters.brand ?? ""}
          onChange={(e) => onFiltersChange({ brand: e.target.value || null })}
          placeholder="Marca"
          className="h-9 w-[140px]"
        />
        <Input
          value={filters.model ?? ""}
          onChange={(e) => onFiltersChange({ model: e.target.value || null })}
          placeholder="Modelo"
          className="h-9 w-[160px]"
        />

        <Select
          value={filters.competitorId ?? "__all__"}
          onValueChange={(v) =>
            onFiltersChange({ competitorId: v === "__all__" ? null : v })
          }
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Concorrente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos os concorrentes</SelectItem>
            {competitors.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={filters.city ?? ""}
          onChange={(e) => onFiltersChange({ city: e.target.value || null })}
          placeholder="Cidade"
          className="h-9 w-[140px]"
        />
        <Input
          value={filters.state ?? ""}
          onChange={(e) =>
            onFiltersChange({ state: e.target.value ? e.target.value.toUpperCase() : null })
          }
          placeholder="UF"
          className="h-9 w-[80px]"
          maxLength={2}
        />

        <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto gap-1">
          <RotateCcw className="h-3.5 w-3.5" /> Limpar
        </Button>
      </div>
    </div>
  );
}
