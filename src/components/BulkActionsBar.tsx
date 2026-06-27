import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  pending?: boolean;
}

export function BulkActionsBar({ count, onClear, onDelete, pending }: Props) {
  if (count === 0) return null;
  return (
    <div className="mb-3 flex items-center justify-between rounded-md border bg-accent/40 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Button size="icon" variant="ghost" onClick={onClear} aria-label="Limpar seleção">
          <X className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {count} {count === 1 ? "item selecionado" : "itens selecionados"}
        </span>
      </div>
      <Button size="sm" variant="destructive" onClick={onDelete} disabled={pending}>
        <Trash2 className="h-4 w-4" /> {pending ? "Excluindo..." : "Excluir selecionados"}
      </Button>
    </div>
  );
}
