import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, Inbox, Eye, Trash2, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImportWizard } from "@/features/imports/components/ImportWizard";
import { useImportLogs, useDeleteImportLog } from "@/features/imports/hooks/useImports";
import type { ImportLog } from "@/repositories/import.repository";

function statusBadge(status: string | null) {
  if (status === "completed") return <Badge variant="secondary">Concluída</Badge>;
  if (status === "partial") return <Badge variant="outline">Parcial</Badge>;
  if (status === "failed") return <Badge variant="destructive">Falha</Badge>;
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}

function CentralImportacoesPage() {
  const logsQ = useImportLogs();
  const deleteMut = useDeleteImportLog();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [details, setDetails] = useState<ImportLog | null>(null);
  const [toDelete, setToDelete] = useState<ImportLog | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const summary = useMemo(() => {
    const rows = logsQ.data ?? [];
    return {
      total: rows.length,
      completed: rows.filter((r) => r.status === "completed").length,
      partial: rows.filter((r) => r.status === "partial").length,
      failed: rows.filter((r) => r.status === "failed").length,
    };
  }, [logsQ.data]);

  const rows = logsQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Central de Importações"
        description="Acompanhe arquivos importados, erros, duplicidades e resultados."
        actions={
          <Button onClick={() => setWizardOpen(true)}>
            <Upload className="h-4 w-4" /> Nova importação
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: summary.total },
          { label: "Concluídas", value: summary.completed },
          { label: "Parciais", value: summary.partial },
          { label: "Falhas", value: summary.failed },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs uppercase text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold">{c.value}</p>
          </Card>
        ))}
      </div>

      {logsQ.isError ? (
        <ErrorState description={(logsQ.error as Error)?.message} onRetry={() => logsQ.refetch()} />
      ) : logsQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma importação ainda."
          description="Importe um CSV ou XLSX para começar a popular seu estoque."
          action={
            <Button onClick={() => setWizardOpen(true)}>
              <Upload className="h-4 w-4" /> Nova importação
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Recebidas</TableHead>
                <TableHead className="text-right">Importadas</TableHead>
                <TableHead className="text-right">Falhas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      {r.file_name ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="uppercase">{r.file_type ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.rows_received}</TableCell>
                  <TableCell className="text-right">{r.rows_imported}</TableCell>
                  <TableCell className="text-right">{r.rows_failed}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDetails(r)}
                        aria-label="Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setToDelete(r)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ImportWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <Dialog open={!!details} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da importação</DialogTitle>
            <DialogDescription>{details?.file_name}</DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Recebidas</p>
                  <p className="text-lg font-semibold">{details.rows_received}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Importadas</p>
                  <p className="text-lg font-semibold">{details.rows_imported}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Falhas</p>
                  <p className="text-lg font-semibold">{details.rows_failed}</p>
                </Card>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Log de erros
                </p>
                <pre className="max-h-[300px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {details.error_log
                    ? JSON.stringify(details.error_log, null, 2)
                    : "Sem erros registrados."}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir registro?"
        description="O log desta importação será removido. Os veículos importados continuam no estoque."
        destructive
        confirmText={deleteMut.isPending ? "Excluindo..." : "Excluir"}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteMut.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/importacoes")({
  component: CentralImportacoesPage,
});
