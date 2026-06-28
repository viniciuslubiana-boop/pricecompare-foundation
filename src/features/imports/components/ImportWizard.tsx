import { useEffect, useMemo, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { parseFile } from "../utils/file-parser";
import { autoMapColumns, mappingIsComplete } from "../utils/column-mapper";
import { buildPreview } from "../services/import.service";
import {
  SYSTEM_FIELDS,
  type ColumnMapping,
  type ParsedFile,
  type PreviewRow,
  type SystemField,
} from "../types";
import { useRunImport } from "../hooks/useImports";
import { useInventoryList } from "@/features/inventory/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL, formatKm } from "@/features/inventory/utils/inventory-formatters";
import { useActiveBaseCompanies } from "@/features/base-companies/hooks/useBaseCompanies";
import { useSelectedBaseCompany } from "@/features/base-companies/context/SelectedBaseCompanyContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "preview" | "done";

const UNSET = "__unset__";
const REQUIRED: SystemField[] = ["brand", "model", "year_model", "km", "price"];

export function ImportWizard({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: activeCompanies = [] } = useActiveBaseCompanies();
  const { selectedId } = useSelectedBaseCompany();
  const [baseCompanyId, setBaseCompanyId] = useState<string>("");
  const inventoryQ = useInventoryList({ baseCompanyId: baseCompanyId || null });
  const runMut = useRunImport();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [dupPolicy, setDupPolicy] = useState<"ignore" | "import">("import");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("upload");
      setFile(null);
      setParsed(null);
      setMapping({});
      setDupPolicy("import");
    } else {
      // pré-seleciona a empresa atual do contexto se houver
      setBaseCompanyId((prev) => prev || selectedId || activeCompanies[0]?.id || "");
    }
  }, [open, selectedId, activeCompanies]);

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    try {
      const result = await parseFile(f);
      setParsed(result);
      setMapping(autoMapColumns(result.columns));
      setStep("mapping");
      toast.success("Arquivo carregado", { description: `${result.rows.length} linha(s) lidas` });
    } catch (e) {
      toast.error("Erro ao ler arquivo", { description: (e as Error).message });
    } finally {
      setParsing(false);
    }
  };

  const preview: PreviewRow[] = useMemo(() => {
    if (!parsed || step !== "preview") return [];
    return buildPreview(parsed.rows, mapping, inventoryQ.data ?? []);
  }, [parsed, mapping, step, inventoryQ.data]);

  const counts = useMemo(() => {
    const c = { valid: 0, invalid: 0, duplicate: 0 };
    preview.forEach((p) => c[p.status]++);
    return c;
  }, [preview]);

  const handleConfirm = async () => {
    if (!parsed || !file || !user) return;
    if (!baseCompanyId) {
      toast.error("Selecione uma Empresa Base antes de importar.");
      return;
    }
    const result = await runMut.mutateAsync({
      fileName: file.name,
      fileType: parsed.fileType,
      rows: parsed.rows,
      mapping,
      userId: user.id,
      baseCompanyId,
      duplicatesPolicy: dupPolicy,
      existing: inventoryQ.data ?? [],
    });
    if (result.status !== "failed") {
      onOpenChange(false);
    } else {
      setStep("done");
    }
  };

  const mappingDone = mappingIsComplete(mapping, REQUIRED);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nova importação</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Selecione um arquivo CSV ou XLSX (até 10 MB)."}
            {step === "mapping" &&
              "Confirme o mapeamento entre colunas do arquivo e campos do sistema."}
            {step === "preview" && "Revise os dados antes de importar."}
            {step === "done" && "Resultado da importação."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Importar para qual Empresa Base? *</Label>
              {activeCompanies.length === 0 ? (
                <p className="text-sm text-destructive">
                  Nenhuma Empresa Base ativa. Cadastre uma em Configurações → Empresas Base.
                </p>
              ) : (
                <Select value={baseCompanyId} onValueChange={setBaseCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa base" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Todo veículo deste arquivo será vinculado à empresa selecionada.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!baseCompanyId) return;
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (!baseCompanyId) {
                  toast.error("Selecione uma Empresa Base antes de enviar o arquivo.");
                  return;
                }
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-12 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
              } ${!baseCompanyId ? "opacity-60" : ""}`}
            >
              {parsing ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              ) : (
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Arraste o arquivo aqui</p>
                <p className="text-sm text-muted-foreground">
                  ou clique para selecionar (.csv, .xlsx)
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="import-file-input"
                disabled={!baseCompanyId}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button asChild variant="outline" disabled={parsing || !baseCompanyId}>
                <label htmlFor="import-file-input" className="cursor-pointer">
                  Selecionar arquivo
                </label>
              </Button>
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          </div>
        )}

        {step === "mapping" && parsed && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SYSTEM_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-sm">
                    {f.label} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={mapping[f.key] ?? UNSET}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [f.key]: v === UNSET ? undefined : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSET}>— Não mapear —</SelectItem>
                      {parsed.columns.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!mappingDone && (
              <p className="text-sm text-destructive">
                Mapeie todos os campos obrigatórios para continuar.
              </p>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <CheckCircle2 className="mr-1 h-3 w-3" /> {counts.valid} válidas
              </Badge>
              <Badge variant="outline">
                <AlertCircle className="mr-1 h-3 w-3" /> {counts.duplicate} possíveis duplicidades
              </Badge>
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" /> {counts.invalid} inválidas
              </Badge>
            </div>

            <div className="rounded-md border">
              <RadioGroup
                value={dupPolicy}
                onValueChange={(v) => setDupPolicy(v as "ignore" | "import")}
                className="flex gap-4 p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="dup-import" value="import" />
                  <Label htmlFor="dup-import">Importar mesmo assim</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="dup-ignore" value="ignore" />
                  <Label htmlFor="dup-ignore">Ignorar duplicadas</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="max-h-[360px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">KM</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 200).map((r) => (
                    <TableRow key={r.index}>
                      <TableCell>
                        {r.status === "valid" && <Badge variant="secondary">Válida</Badge>}
                        {r.status === "duplicate" && <Badge variant="outline">Duplicada</Badge>}
                        {r.status === "invalid" && <Badge variant="destructive">Inválida</Badge>}
                      </TableCell>
                      <TableCell>{r.values.brand}</TableCell>
                      <TableCell>{r.values.model}</TableCell>
                      <TableCell>{r.values.year_model}</TableCell>
                      <TableCell className="text-right">
                        {formatKm(Number(r.values.km) || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBRL(Number(r.values.price) || 0)}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                        {r.duplicateReason ?? r.errors.join("; ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {preview.length > 200 && (
              <p className="text-xs text-muted-foreground">
                Mostrando 200 de {preview.length} linhas. Todas serão processadas.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === "mapping" && (
            <>
              <Button variant="ghost" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button disabled={!mappingDone} onClick={() => setStep("preview")}>
                Pré-visualizar
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={() => setStep("mapping")}>
                Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={runMut.isPending || counts.valid + counts.duplicate === 0}
              >
                {runMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar importação
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
