import type { RankingEntry } from "@/features/analytics";
import { EmptyState } from "@/components/EmptyState";
import { ListOrdered } from "lucide-react";

const fmtMoney = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface Props {
  entries: RankingEntry[];
  emptyLabel?: string;
}

export function RankingCard({ entries, emptyLabel = "Sem dados suficientes" }: Props) {
  if (!entries.length) {
    return (
      <EmptyState
        icon={ListOrdered}
        title={emptyLabel}
        description="Importe veículos ou extraia concorrentes para popular o ranking."
      />
    );
  }
  const max = Math.max(...entries.map((e) => e.count), 1);
  return (
    <ol className="space-y-2">
      {entries.map((e, i) => (
        <li key={`${e.key}-${i}`} className="flex items-center gap-3">
          <span className="w-6 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium">{e.key}</p>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {e.count} · {fmtMoney(e.avgPrice)}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-[#F97316]"
                style={{ width: `${(e.count / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
