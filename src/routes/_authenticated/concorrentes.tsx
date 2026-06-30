import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SearchInput } from "@/components/SearchInput";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CompetitorForm } from "@/features/competitors/components/CompetitorForm";
import { CompetitorTable } from "@/features/competitors/components/CompetitorTable";
import { CompetitorsStockOverview } from "@/features/competitors/components/CompetitorsStockOverview";
import { ImportWizard } from "@/features/imports/components/ImportWizard";
import {
  useCompetitorsList,
  useCreateCompetitor,
  useUpdateCompetitor,
  useSetCompetitorStatus,
  useDeleteCompetitor,
} from "@/features/competitors/hooks/useCompetitors";
import type { Competitor, CompetitorStatus } from "@/features/competitors/types/competitor.types";

type StatusFilter = "all" | CompetitorStatus;

function ConcorrentesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [toDelete, setToDelete] = useState<Competitor | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<Competitor | null>(null);

  const filters = useMemo(() => ({ search, status }), [search, status]);
  const listQ = useCompetitorsList(filters);
  const createMut = useCreateCompetitor();
  const updateMut = useUpdateCompetitor();
  const statusMut = useSetCompetitorStatus();
  const deleteMut = useDeleteCompetitor();

  const rows = listQ.data ?? [];
  const isEmpty = !listQ.isLoading && !listQ.isError && rows.length === 0;
  const filtersActive = !!search || status !== "all";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Competitor) => {
    setEditing(c);
    setFormOpen(true);
  };

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
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
        title="Concorrentes"
        description="Cadastre e acompanhe os sites que deseja monitorar."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo concorrente
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou URL..."
        />
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listQ.isError ? (
        <ErrorState
          title="Não foi possível carregar os concorrentes"
          description={(listQ.error as Error)?.message}
          onRetry={() => listQ.refetch()}
        />
      ) : listQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Users}
          title={filtersActive ? "Nenhum concorrente encontrado" : "Nenhum concorrente cadastrado."}
          description={
            filtersActive
              ? "Ajuste os filtros para encontrar o que procura."
              : "Cadastre os sites das lojas que deseja monitorar."
          }
          action={
            !filtersActive ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Cadastrar concorrente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <BulkActionsBar
            count={selected.size}
            onClear={() => setSelected(new Set())}
            onDelete={() => setBulkConfirmOpen(true)}
            pending={deleteMut.isPending}
          />
          <CompetitorTable
            rows={rows}
            onEdit={openEdit}
            onToggleStatus={(c) =>
              statusMut.mutate({
                id: c.id,
                status: (c.status as CompetitorStatus) === "active" ? "inactive" : "active",
              })
            }
            onDelete={(c) => setToDelete(c)}
            onImport={(c) => setImportTarget(c)}
            selected={selected}
            onToggleOne={toggleOne}
            onToggleAll={toggleAll}
          />
          <CompetitorsStockOverview competitors={rows} />
        </>
      )}

      <CompetitorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        competitor={editing}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={async (values) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, values });
          } else {
            await createMut.mutateAsync(values);
          }
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir concorrente?"
        description={
          toDelete ? `O concorrente "${toDelete.name}" será removido permanentemente.` : undefined
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
        title={`Excluir ${selected.size} ${selected.size === 1 ? "concorrente" : "concorrentes"}?`}
        description="Esta ação não pode ser desfeita. Os itens selecionados serão removidos permanentemente."
        destructive
        confirmText={deleteMut.isPending ? "Excluindo..." : "Excluir selecionados"}
        onConfirm={handleBulkDelete}
      />

      <ImportWizard
        open={!!importTarget}
        onOpenChange={(o) => !o && setImportTarget(null)}
        initialTarget="competitor"
        initialCompetitorId={importTarget?.id}
        lockTarget
      />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/concorrentes")({
  head: () => ({ meta: [{ title: "Concorrentes · PriceCompare" }] }),
  component: ConcorrentesPage,
});
