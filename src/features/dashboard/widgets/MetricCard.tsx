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
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  primary: "text-[#F97316]",
};

export function MetricCard({ label, value, hint, icon, tone = "default", className }: Props) {
  return (
    <Card className={cn("overflow-hidden", className)}>
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
