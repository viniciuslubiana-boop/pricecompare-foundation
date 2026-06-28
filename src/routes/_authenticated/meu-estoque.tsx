import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Plus, Upload, Pencil, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SearchInput } from "@/components/SearchInput";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useInventoryList,
  useInventoryBrands,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/features/inventory/hooks/useInventory";
import { VehicleFormDialog } from "@/features/inventory/components/VehicleFormDialog";
import type { Vehicle } from "@/features/inventory/types/inventory.types";
import { formatBRL, formatKm } from "@/features/inventory/utils/inventory-formatters";
import { BaseCompanySelector } from "@/features/base-companies/components/BaseCompanySelector";
import { useSelectedBaseCompany } from "@/features/base-companies/context/SelectedBaseCompanyContext";
import { Building2 } from "lucide-react";

const ALL = "__all__";

function MeuEstoquePage() {
  const { selectedId, selected: selectedCompany, hasAny, isLoading: loadingCompanies } =
    useSelectedBaseCompany();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const filters = useMemo(
    () => ({ search, brand, baseCompanyId: selectedId }),
    [search, brand, selectedId],
  );
  const vehiclesQ = useInventoryList(filters);
  const brandsQ = useInventoryBrands(selectedId);
  const createMut = useCreateVehicle();
  const updateMut = useUpdateVehicle();
  const deleteMut = useDeleteVehicle();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setFormOpen(true);
  };

  const rows = vehiclesQ.data ?? [];
  const isEmpty = !vehiclesQ.isLoading && !vehiclesQ.isError && rows.length === 0;
  const filtersActive = !!search || brand !== ALL;

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = rows.some((r) => selected.has(r.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    await Promise.allSettled(ids.map((id) => deleteMut.mutateAsync(id)));
    setSelected(new Set());
    setBulkConfirmOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Meu Estoque"
        description="Cadastre, edite e acompanhe os veículos da sua concessionária."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/importacoes">
                <Upload className="h-4 w-4" /> Importar arquivo
              </Link>
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Adicionar veículo
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca ou modelo..."
        />
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filtrar por marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as marcas</SelectItem>
            {(brandsQ.data ?? []).map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {vehiclesQ.isError ? (
        <ErrorState
          title="Não foi possível carregar o estoque"
          description={(vehiclesQ.error as Error)?.message}
          onRetry={() => vehiclesQ.refetch()}
        />
      ) : vehiclesQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty && !filtersActive ? (
        <EmptyState
          icon={Package}
          title="Seu estoque ainda está vazio."
          description="Cadastre veículos manualmente ou importe uma planilha para começar."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Adicionar veículo
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState
          title="Nenhum veículo encontrado."
          description="Ajuste os filtros ou limpe a busca para ver outros resultados."
        />
      ) : (
        <>
          <BulkActionsBar
            count={selected.size}
            onClear={() => setSelected(new Set())}
            onDelete={() => setBulkConfirmOpen(true)}
            pending={deleteMut.isPending}
          />
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allChecked ? true : someChecked ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano/Modelo</TableHead>
                  <TableHead className="text-right">KM</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => (
                  <TableRow key={v.id} data-state={selected.has(v.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(v.id)}
                        onCheckedChange={() => toggleOne(v.id)}
                        aria-label={`Selecionar ${v.brand} ${v.model}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{v.brand}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell>{v.year_model}</TableCell>
                    <TableCell className="text-right">{formatKm(v.km)}</TableCell>
                    <TableCell className="text-right">
                      {formatBRL(v.price as unknown as number)}
                    </TableCell>
                    <TableCell>{v.supplier_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {v.source ?? "manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(v)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setToDelete(v)}
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
        </>
      )}

      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editing}
        defaultBaseCompanyId={selectedId}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={async (values, baseCompanyId) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, values, baseCompanyId });
          } else {
            await createMut.mutateAsync({ values, baseCompanyId });
          }
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir veículo?"
        description={
          toDelete
            ? `O veículo ${toDelete.brand} ${toDelete.model} (${toDelete.year_model}) será removido permanentemente.`
            : undefined
        }
        confirmText={deleteMut.isPending ? "Excluindo..." : "Excluir"}
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteMut.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={`Excluir ${selected.size} ${selected.size === 1 ? "veículo" : "veículos"}?`}
        description="Esta ação não pode ser desfeita. Os itens selecionados serão removidos permanentemente."
        destructive
        confirmText={deleteMut.isPending ? "Excluindo..." : "Excluir selecionados"}
        onConfirm={handleBulkDelete}
      />

      {deleteMut.isPending ? (
        <div className="sr-only">
          <Loader2 className="animate-spin" />
        </div>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/meu-estoque")({
  head: () => ({ meta: [{ title: "Meu Estoque · PriceCompare" }] }),
  component: MeuEstoquePage,
});
