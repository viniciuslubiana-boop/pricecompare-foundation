import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InsightTone = "info" | "success" | "warning" | "danger";

interface Props {
  tone?: InsightTone;
  icon?: ReactNode;
  title: string;
  description?: string;
}

const TONE: Record<InsightTone, string> = {
  info: "border-l-sky-500 bg-sky-500/5",
  success: "border-l-emerald-500 bg-emerald-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  danger: "border-l-red-500 bg-red-500/5",
};

export function InsightCard({ tone = "info", icon, title, description }: Props) {
  return (
    <div className={cn("flex items-start gap-3 rounded-md border border-l-4 p-3", TONE[tone])}>
      {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
