import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectedBaseCompany } from "../context/SelectedBaseCompanyContext";

interface Props {
  className?: string;
  includeAll?: boolean;
  value?: string | null;
  onChange?: (id: string | null) => void;
}

export const ALL_BASE_COMPANIES = "__all__";

/**
 * Seletor global de Empresa Base. Usa o contexto por padrão; passe `value`/`onChange`
 * para uso controlado (ex.: dashboard com opção "Todas").
 */
export function BaseCompanySelector({ className, includeAll, value, onChange }: Props) {
  const { selectedId, setSelectedId, active, isLoading } = useSelectedBaseCompany();
  const current = value !== undefined ? value : selectedId;

  if (isLoading) return null;
  if (active.length === 0) return null;

  const handle = (v: string) => {
    const id = v === ALL_BASE_COMPANIES ? null : v;
    if (onChange) onChange(id);
    else setSelectedId(id);
  };

  return (
    <Select value={current ?? ALL_BASE_COMPANIES} onValueChange={handle}>
      <SelectTrigger className={className ?? "w-full sm:w-64"}>
        <SelectValue placeholder="Selecione a empresa base" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value={ALL_BASE_COMPANIES}>Todas as empresas</SelectItem>}
        {active.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
