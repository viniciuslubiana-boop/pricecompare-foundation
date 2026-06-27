import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SearchInput } from "@/components/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComparisonFilters } from "../types/comparison.types";

interface Props {
  value: ComparisonFilters;
  onChange: (next: ComparisonFilters) => void;
  competitorOptions?: string[];
}

const ALL = "__all__";

export function ComparisonFiltersBar({ value, onChange, competitorOptions = [] }: Props) {
  const patch = (p: Partial<ComparisonFilters>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            value={value.search ?? ""}
            onChange={(e) => patch({ search: e.target.value })}
            placeholder="Buscar marca ou modelo..."
          />
        </div>
        <div className="flex min-w-[220px] items-center gap-3">
          <Label className="whitespace-nowrap text-xs">
            Score mínimo: {value.minScore ?? 0}%
          </Label>
          <Slider
            value={[value.minScore ?? 0]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => patch({ minScore: v[0] })}
            className="w-40"
          />
        </div>
        {competitorOptions.length > 0 && (
          <div className="min-w-[220px] space-y-1">
            <Label className="text-xs">Concorrente específico</Label>
            <Select
              value={value.competitorName ?? ALL}
              onValueChange={(v) => patch({ competitorName: v === ALL ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {competitorOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Toggle
          label="Acima do mercado"
          checked={!!value.onlyAboveMarket}
          onCheckedChange={(c) => patch({ onlyAboveMarket: c })}
        />
        <Toggle
          label="Melhor preço"
          checked={!!value.onlyBestPrice}
          onCheckedChange={(c) => patch({ onlyBestPrice: c })}
        />
        <Toggle
          label="Oportunidades"
          checked={!!value.onlyOpportunities}
          onCheckedChange={(c) => patch({ onlyOpportunities: c })}
        />
        <Toggle
          label="Competitividade < 80%"
          checked={!!value.onlyLowCompetitiveness}
          onCheckedChange={(c) => patch({ onlyLowCompetitiveness: c })}
        />
        <Toggle
          label="Diferenciais"
          checked={!!value.onlyDifferentials}
          onCheckedChange={(c) => patch({ onlyDifferentials: c })}
        />
        <Toggle
          label="Você mais barato"
          checked={!!value.onlyMeCheaper}
          onCheckedChange={(c) => patch({ onlyMeCheaper: c })}
        />
        <Toggle
          label="Concorrente mais barato"
          checked={!!value.onlyCompetitorCheaper}
          onCheckedChange={(c) => patch({ onlyCompetitorCheaper: c })}
        />
      </div>
    </div>
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
