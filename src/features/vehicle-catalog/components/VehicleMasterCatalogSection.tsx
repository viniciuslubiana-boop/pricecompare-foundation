import { useMemo, useState } from "react";
import { Plus, Pencil, Power, Trash2, Search, ShieldAlert, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import {
  useCatalogAudit,
  useCreateCatalogEntry,
  useDeleteCatalogEntry,
  useToggleCatalogActive,
  useUpdateCatalogEntry,
  useVehicleCatalog,
} from "../hooks";
import { AliasManagerSection } from "./AliasManagerSection";
import { CoverageReportSection } from "./CoverageReportSection";
import { AliasSuggestionsSection } from "./AliasSuggestionsSection";
import type { VehicleMasterCatalogInput, VehicleMasterCatalogRow, VehicleType } from "../types";

const EMPTY_FORM: VehicleMasterCatalogInput = {
  vehicle_type: "carro",
  brand: "",
  canonical_model: "",
  canonical_version: null,
  displacement: null,
  fuel: null,
  transmission: null,
  start_year: null,
  end_year: null,
  active: true,
  notes: null,
};

export function VehicleMasterCatalogSection() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useVehicleCatalog();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<VehicleMasterCatalogRow | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((r) =>
      [r.brand, r.canonical_model, r.canonical_version ?? "", r.displacement ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState
            icon={ShieldAlert}
            title="Acesso restrito"
            description="Somente Administradores podem gerenciar o Catálogo Mestre de Veículos."
          />
        </CardContent>
      </Card>
    );
  }

  const onNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (row: VehicleMasterCatalogRow) => {
    setEditing(row);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle>Catálogo Mestre de Veículos</CardTitle>
            <CardDescription>
              Referência única de normalização. Não altera o Comparison Engine — apenas melhora a qualidade da entrada.
            </CardDescription>
          </div>
          <Button onClick={onNew}>
            <Plus className="h-4 w-4" /> Novo modelo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar marca, modelo ou versão…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Badge variant="secondary">{filtered.length} registros</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum modelo encontrado"
              description="Cadastre o primeiro modelo canônico para iniciar o catálogo."
            />
          ) : (
            <CatalogTable rows={filtered} onEdit={onEdit} />
          )}
        </CardContent>
      </Card>

      <CatalogAuditCard />

      <CatalogFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
      />
    </div>
  );
}

function CatalogTable({
  rows,
  onEdit,
}: {
  rows: VehicleMasterCatalogRow[];
  onEdit: (row: VehicleMasterCatalogRow) => void;
}) {
  const toggle = useToggleCatalogActive();
  const remove = useDeleteCatalogEntry();
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Modelo canônico</TableHead>
            <TableHead>Versão</TableHead>
            <TableHead>Cilindrada</TableHead>
            <TableHead>Anos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="capitalize">{r.vehicle_type}</TableCell>
              <TableCell>{r.brand}</TableCell>
              <TableCell className="font-medium">{r.canonical_model}</TableCell>
              <TableCell>{r.canonical_version ?? "—"}</TableCell>
              <TableCell>{r.displacement ?? "—"}</TableCell>
              <TableCell>
                {r.start_year ?? "—"}
                {r.end_year ? ` – ${r.end_year}` : ""}
              </TableCell>
              <TableCell>
                {r.active ? (
                  <Badge>Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggle.mutate({ id: r.id, active: !r.active })}
                    title={r.active ? "Inativar" : "Ativar"}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Excluir ${r.brand} ${r.canonical_model}?`)) remove.mutate(r.id);
                    }}
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
  );
}

function CatalogFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: VehicleMasterCatalogRow | null;
}) {
  const create = useCreateCatalogEntry();
  const update = useUpdateCatalogEntry();
  const [form, setForm] = useState<VehicleMasterCatalogInput>(EMPTY_FORM);

  // Reset form on open
  useMemoOnOpen(open, () => {
    if (initial) {
      const { id: _id, created_at: _c, updated_at: _u, created_by: _b, ...rest } = initial;
      setForm(rest as VehicleMasterCatalogInput);
    } else {
      setForm(EMPTY_FORM);
    }
  });

  const submit = async () => {
    const payload: VehicleMasterCatalogInput = {
      ...form,
      brand: form.brand.trim(),
      canonical_model: form.canonical_model.trim(),
      canonical_version: form.canonical_version?.toString().trim() || null,
      displacement: form.displacement?.toString().trim() || null,
      fuel: form.fuel?.toString().trim() || null,
      transmission: form.transmission?.toString().trim() || null,
      notes: form.notes?.toString().trim() || null,
    };
    if (!payload.brand || !payload.canonical_model) return;
    if (initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const set = <K extends keyof VehicleMasterCatalogInput>(
    key: K,
    value: VehicleMasterCatalogInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar modelo" : "Novo modelo"}</DialogTitle>
          <DialogDescription>
            Cadastre o modelo canônico que servirá de referência para normalização.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select
              value={form.vehicle_type}
              onValueChange={(v) => set("vehicle_type", v as VehicleType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carro">Carro</SelectItem>
                <SelectItem value="moto">Moto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.active ? "ativo" : "inativo"}
              onValueChange={(v) => set("active", v === "ativo")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marca *</Label>
            <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div>
            <Label>Modelo canônico *</Label>
            <Input value={form.canonical_model} onChange={(e) => set("canonical_model", e.target.value)} />
          </div>
          <div>
            <Label>Versão canônica</Label>
            <Input value={form.canonical_version ?? ""} onChange={(e) => set("canonical_version", e.target.value)} />
          </div>
          <div>
            <Label>Cilindrada</Label>
            <Input value={form.displacement ?? ""} onChange={(e) => set("displacement", e.target.value)} />
          </div>
          <div>
            <Label>Combustível</Label>
            <Input value={form.fuel ?? ""} onChange={(e) => set("fuel", e.target.value)} />
          </div>
          <div>
            <Label>Câmbio</Label>
            <Input value={form.transmission ?? ""} onChange={(e) => set("transmission", e.target.value)} />
          </div>
          <div>
            <Label>Ano inicial</Label>
            <Input
              type="number"
              value={form.start_year ?? ""}
              onChange={(e) => set("start_year", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label>Ano final</Label>
            <Input
              type="number"
              value={form.end_year ?? ""}
              onChange={(e) => set("end_year", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="col-span-2">
            <Label>Observações</Label>
            <Input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CatalogAuditCard() {
  const { data, isLoading } = useCatalogAudit();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoria do catálogo</CardTitle>
        <CardDescription>
          Veículos sem modelo canônico, aliases órfãos e modelos duplicados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data ? null : (
          <div className="grid gap-3 md:grid-cols-3">
            <AuditTile label="Veículos sem modelo canônico" count={data.vehiclesWithoutCanonical.length} />
            <AuditTile label="Aliases órfãos" count={data.orphanAliases.length} />
            <AuditTile label="Modelos duplicados" count={data.duplicatedModels.length} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuditTile({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{count}</div>
    </div>
  );
}

// Tiny helper to reset form whenever dialog opens.
import { useEffect } from "react";
function useMemoOnOpen(open: boolean, fn: () => void) {
  useEffect(() => {
    if (open) fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
