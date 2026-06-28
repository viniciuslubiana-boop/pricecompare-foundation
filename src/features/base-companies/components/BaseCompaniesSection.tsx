import { useState } from "react";
import { Plus, Pencil, Trash2, Store } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import {
  useBaseCompanies,
  useCreateBaseCompany,
  useUpdateBaseCompany,
  useDeleteBaseCompany,
} from "../hooks/useBaseCompanies";
import { BaseCompanyForm, type BaseCompanyFormValues } from "./BaseCompanyForm";
import { BASE_COMPANY_TYPE_LABEL, type BaseCompany } from "../types";

export function BaseCompaniesSection() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useBaseCompanies();
  const createMut = useCreateBaseCompany();
  const updateMut = useUpdateBaseCompany();
  const deleteMut = useDeleteBaseCompany();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BaseCompany | null>(null);
  const [toDelete, setToDelete] = useState<BaseCompany | null>(null);

  const companies = data ?? [];
  const activeCount = companies.filter((c) => c.status === "active").length;

  const openCreate = () => {
    if (activeCount >= 2) {
      toast.warning("O sistema permite no máximo duas Empresas Base ativas.", {
        description: "Inative uma das empresas existentes ou cadastre como inativa.",
      });
    }
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: BaseCompany) => {
    setEditing(c);
    setFormOpen(true);
  };

  const handleSubmit = async (values: BaseCompanyFormValues) => {
    const payload = {
      name: values.name,
      city: values.city || null,
      state: values.state || null,
      website: values.website || null,
      logo_url: values.logo_url || null,
      type: values.type,
      status: values.status,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch {
      /* toast já no hook */
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> Empresas Base
          </CardTitle>
          <CardDescription>
            Suas lojas próprias. Até 2 ativas. Todo estoque é vinculado a uma Empresa Base.
          </CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova empresa
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Nenhuma Empresa Base cadastrada."
            description={
              isAdmin
                ? "Cadastre sua loja para começar a importar estoque e comparar com o mercado."
                : "Solicite a um administrador o cadastro de uma Empresa Base."
            }
            action={
              isAdmin ? (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Cadastrar primeira empresa
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-[100px] text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {BASE_COMPANY_TYPE_LABEL[c.type as keyof typeof BASE_COMPANY_TYPE_LABEL] ?? c.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {[c.city, c.state].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{c.website ?? "—"}</TableCell>
                    <TableCell>
                      {c.status === "active" ? (
                        <Badge>Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setToDelete(c)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!isAdmin && companies.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Somente administradores podem cadastrar, editar ou ativar/inativar Empresas Base.
          </p>
        )}
      </CardContent>

      <BaseCompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        company={editing}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir Empresa Base?"
        description={
          toDelete
            ? `A empresa "${toDelete.name}" será removida. Veículos vinculados impedirão a exclusão — nesse caso, inative-a.`
            : undefined
        }
        destructive
        confirmText={deleteMut.isPending ? "Excluindo..." : "Excluir"}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteMut.mutateAsync(toDelete.id);
          } finally {
            setToDelete(null);
          }
        }}
      />
    </Card>
  );
}
