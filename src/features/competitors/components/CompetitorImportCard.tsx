import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import type { ImportLog } from "@/repositories/import.repository";

interface Props {
  logs: ImportLog[];
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusLabel(status: string | null) {
  switch (status) {
    case "completed":
      return "Concluída";
    case "partial":
      return "Parcial";
    case "failed":
      return "Falhou";
    default:
      return status ?? "—";
  }
}

export function CompetitorImportCard({ logs }: Props) {
  const last = logs[0];
  const totalImported = logs.reduce((sum, l) => sum + (l.rows_imported ?? 0), 0);
  const totalFailed = logs.reduce((sum, l) => sum + (l.rows_failed ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Estoque importado</CardTitle>
          </div>
          {last && (
            <span className="text-xs text-muted-foreground">
              {logs.length} importação{logs.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {last ? (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{last.file_name ?? "Importação sem nome"}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(last.created_at)}</p>
                <p className="mt-1 text-xs font-medium">
                  Status: <span className="text-foreground">{statusLabel(last.status)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Última importação</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {(last.rows_imported ?? 0).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">veículos</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Falhas</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {(last.rows_failed ?? 0).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">na última</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total importado</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {totalImported.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">veículos</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total de falhas</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {totalFailed.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">veículos</p>
              </div>
            </div>

            {last.rows_failed && last.rows_failed > 0 ? (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Última importação teve {last.rows_failed} falha
                  {last.rows_failed !== 1 ? "s" : ""}. Revise o log de importações.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Última importação concluída sem falhas.</span>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma importação de estoque registrada para este concorrente.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
