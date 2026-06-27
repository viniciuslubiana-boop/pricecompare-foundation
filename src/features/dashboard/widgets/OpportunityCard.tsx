import { EmptyState } from "@/components/EmptyState";
import { Target } from "lucide-react";

interface Item {
  label: string;
  value: string | number;
}

interface Props {
  items: Item[];
  emptyLabel?: string;
}

export function OpportunityCard({ items, emptyLabel = "Nenhuma oportunidade identificada" }: Props) {
  if (!items.length) {
    return (
      <EmptyState
        icon={Target}
        title={emptyLabel}
        description="Quando concorrentes tiverem veículos ausentes no seu estoque, eles aparecerão aqui."
      />
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((it) => (
        <li key={it.label} className="flex items-center justify-between py-2 text-sm">
          <span className="truncate text-muted-foreground">{it.label}</span>
          <span className="shrink-0 font-semibold tabular-nums">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
