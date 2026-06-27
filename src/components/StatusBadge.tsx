import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Status = "ativo" | "inativo" | "pendente" | "erro" | "sucesso";

const STYLES: Record<Status, string> = {
  ativo: "bg-success/15 text-success border-success/30",
  sucesso: "bg-success/15 text-success border-success/30",
  inativo: "bg-muted text-muted-foreground border-border",
  pendente: "bg-warning/15 text-warning-foreground border-warning/40",
  erro: "bg-destructive/15 text-destructive border-destructive/30",
};

const LABELS: Record<Status, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
  erro: "Erro",
  sucesso: "Sucesso",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
