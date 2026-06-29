import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackagePlus, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  buildBulkAliasPreview,
  commitBulkAliases,
  type BulkAliasCommitReport,
  type BulkAliasPreviewItem,
  type BulkAliasStatus,
} from "../bulk-aliases";

const STATUS_META: Record<
  BulkAliasStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  ready: { label: "Pronto para cadastrar", variant: "default", icon: CheckCircle2 },
  already_exists: { label: "Já existe", variant: "secondary", icon: Info },
  canonical_not_found: { label: "Canônico não encontrado", variant: "destructive", icon: XCircle },
  manual_review: { label: "Revisão manual necessária", variant: "outline", icon: AlertTriangle },
};

export function BulkAliasImportDialog() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<BulkAliasPreviewItem[] | null>(null);
  const [report, setReport] = useState<BulkAliasCommitReport | null>(null);

  const previewMut = useMutation({
    mutationFn: () => buildBulkAliasPreview(),
    onSuccess: (data) => setPreview(data),
    onError: (e: Error) => toast.error(e.message),
  });

  const commitMut = useMutation({
    mutationFn: () => commitBulkAliases(preview ?? []),
    onSuccess: (r) => {
      setReport(r);
      qc.invalidateQueries({ queryKey: ["vehicle-model-aliases"] });
      qc.invalidateQueries({ queryKey: ["vehicle-master-catalog"] });
      toast.success(`${r.inserted} aliases cadastrados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  const readyCount = (preview ?? []).filter((p) => p.status === "ready").length;

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      setPreview(null);
      setReport(null);
      previewMut.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackagePlus className="h-4 w-4" />
          Importar aliases prioritários
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar aliases prioritários</DialogTitle>
          <DialogDescription>
            Revise o preview antes de salvar. Apenas itens com status “Pronto para cadastrar” serão inseridos.
            Pares duvidosos ficam como “Revisão manual necessária” e devem ser tratados individualmente.
          </DialogDescription>
        </DialogHeader>

        {previewMut.isPending ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : report ? (
          <ReportView report={report} />
        ) : preview ? (
          <div className="max-h-[55vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Modelo canônico</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((p, i) => {
                  const meta = STATUS_META[p.status];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={`${p.brand}-${p.alias}-${i}`}>
                      <TableCell>{p.brand}</TableCell>
                      <TableCell className="font-medium">{p.alias}</TableCell>
                      <TableCell>{p.canonical}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                        {p.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{p.reason}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          {report ? (
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => commitMut.mutate()}
                disabled={!preview || readyCount === 0 || commitMut.isPending}
              >
                {commitMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Cadastrar {readyCount} aliases
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportView({ report }: { report: BulkAliasCommitReport }) {
  const items: Array<[string, number]> = [
    ["Inseridos agora", report.inserted],
    ["Já existiam", report.skippedAlreadyExists],
    ["Sem canônico", report.skippedNoCanonical],
    ["Revisão manual", report.manualReview],
    ["Total de aliases aprovados", report.totalAliasesApproved],
    ["Total vinculados ao canônico", report.totalLinked],
    ["Aliases órfãos", report.orphanAliases],
    ["Modelos canônicos usados", report.canonicalModelsUsed],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 py-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}
