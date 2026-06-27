import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  /** Valor de 0 a 100 */
  value: number;
}

export function ConfidenceBadge({ value }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const tone =
    pct >= 80
      ? "bg-success/15 text-success border-success/30"
      : pct >= 50
        ? "bg-warning/15 text-warning-foreground border-warning/40"
        : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={cn("font-medium tabular-nums", tone)}>
      Confiança {pct}%
    </Badge>
  );
}
