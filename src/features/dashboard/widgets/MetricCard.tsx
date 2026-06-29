import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  className?: string;
  /** Quando informado, o card vira um botão acessível para abrir o drill-down. */
  onClick?: () => void;
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  primary: "text-[#F97316]",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
  onClick,
}: Props) {
  const interactive = !!onClick;
  return (
    <Card
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={interactive ? `Abrir detalhes de ${label}` : undefined}
      className={cn(
        "overflow-hidden",
        interactive &&
          "cursor-pointer transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={cn("mt-2 text-3xl font-semibold tabular-nums", TONE[tone])}>{value}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {icon ? <div className="shrink-0 text-muted-foreground">{icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

