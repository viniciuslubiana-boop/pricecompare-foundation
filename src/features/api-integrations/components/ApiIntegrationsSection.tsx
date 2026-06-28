import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Play, Plug, RefreshCw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBaseCompanies } from "@/features/base-companies/hooks/useBaseCompanies";
import { useCompetitors } from "@/features/competitors/hooks/useCompetitors";
import {
  useApiIntegrationLogs,
  useApiIntegrationMutations,
  useApiIntegrations,
} from "../hooks/useApiIntegrations";
import type { ApiIntegrationInput, ApiIntegrationPublic } from "../types";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  success: { label: "Sucesso", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  empty: { label: "Vazio", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  auth_error: { label: "Autenticação", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
  format_error: { label: "Formato", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
  unavailable: { label: "Indisponível", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
  failed: { label: "Falha", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

const EMPTY_INPUT: ApiIntegrationInput = {
  name: "",
  target_type: "my_stock",
  base_company_id: null,
  competitor_id: null,
  url: "",
  http_method: "GET",
  auth_header_name: "Authorization",
  auth_header_value: "",
  extra_headers: {},
  body_template: null,
  field_mapping: {
    list_path: "",
    fields: {
      brand: "",
      model: "",
      version: "",
      year_model: "",
      km: "",
      price: "",
      link: "",
      photo: "",
    },
  },
  frequency: "manual",
  status: "active",
};

export function ApiIntegrationsSection() {
  const { data: integrations, isLoading } = useApiIntegrations();
  const { remove, test, run } = useApiIntegrationMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiIntegrationPublic | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" /> Integração por API
            </CardTitle>
            <CardDescription>
              Conecte APIs externas para sincronizar estoque (Meu Estoque ou Concorrente). A chave nunca
              é exposta no navegador.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nova integração
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !integrations?.length ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma integração cadastrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última execução</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.name}</TableCell>
                    <TableCell>
                      {it.target_type === "my_stock" ? "Meu Estoque" : "Concorrente"}
                    </TableCell>
                    <TableCell className="capitalize">{it.frequency}</TableCell>
                    <TableCell>
                      <Badge variant={it.status === "active" ? "default" : "secondary"}>
                        {it.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {it.last_run_at ? new Date(it.last_run_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => test.mutate(it.id)}
                        disabled={test.isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Testar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => run.mutate(it.id)}
                        disabled={run.isPending}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Atualizar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(it);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(it.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ApiIntegrationLogs />

      <ApiIntegrationForm
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={() => setOpen(false)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Excluir integração?"
        description="Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={() => {
          if (confirmDelete) remove.mutate(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function ApiIntegrationForm({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: ApiIntegrationPublic | null;
  onSaved: () => void;
}) {
  const { create, update } = useApiIntegrationMutations();
  const { data: companies } = useBaseCompanies();
  const { data: competitors } = useCompetitors();

  const [form, setForm] = useState<ApiIntegrationInput>(EMPTY_INPUT);
  const [extraHeadersText, setExtraHeadersText] = useState("");
  const [bodyTemplateText, setBodyTemplateText] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        target_type: editing.target_type,
        base_company_id: editing.base_company_id,
        competitor_id: editing.competitor_id,
        url: editing.url,
        http_method: editing.http_method,
        auth_header_name: editing.auth_header_name ?? "Authorization",
        auth_header_value: "",
        extra_headers: editing.extra_headers ?? {},
        body_template: editing.body_template ?? null,
        field_mapping: editing.field_mapping ?? EMPTY_INPUT.field_mapping,
        frequency: editing.frequency,
        status: editing.status,
      });
      setExtraHeadersText(JSON.stringify(editing.extra_headers ?? {}, null, 2));
      setBodyTemplateText(
        editing.body_template ? JSON.stringify(editing.body_template, null, 2) : "",
      );
    } else {
      setForm(EMPTY_INPUT);
      setExtraHeadersText("");
      setBodyTemplateText("");
    }
  }, [editing, open]);

  const submit = () => {
    let extraHeaders: Record<string, string> = {};
    let bodyTemplate: unknown | null = null;
    try {
      extraHeaders = extraHeadersText.trim() ? JSON.parse(extraHeadersText) : {};
    } catch {
      alert("Headers adicionais: JSON inválido.");
      return;
    }
    try {
      bodyTemplate = bodyTemplateText.trim() ? JSON.parse(bodyTemplateText) : null;
    } catch {
      alert("Body template: JSON inválido.");
      return;
    }
    const payload: ApiIntegrationInput = {
      ...form,
      extra_headers: extraHeaders,
      body_template: bodyTemplate,
    };
    if (editing) {
      update.mutate({ ...payload, id: editing.id }, { onSuccess: onSaved });
    } else {
      create.mutate(payload, { onSuccess: onSaved });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar integração" : "Nova integração"}</DialogTitle>
          <DialogDescription>
            Configure uma API externa de estoque. O token é armazenado de forma segura no servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome da integração</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.target_type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    target_type: v as ApiIntegrationInput["target_type"],
                    base_company_id: null,
                    competitor_id: null,
                  })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="my_stock">Meu Estoque</SelectItem>
                  <SelectItem value="competitor">Concorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.target_type === "my_stock" ? (
              <div className="space-y-1.5">
                <Label>Empresa Base</Label>
                <Select
                  value={form.base_company_id ?? ""}
                  onValueChange={(v) => setForm({ ...form, base_company_id: v || null })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(companies ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Concorrente</Label>
                <Select
                  value={form.competitor_id ?? ""}
                  onValueChange={(v) => setForm({ ...form, competitor_id: v || null })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(competitors ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>URL da API</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Método</Label>
              <Select
                value={form.http_method}
                onValueChange={(v) => setForm({ ...form, http_method: v as "GET" | "POST" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Header de autenticação</Label>
              <Input
                value={form.auth_header_name ?? ""}
                placeholder="Authorization"
                onChange={(e) => setForm({ ...form, auth_header_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Token / API Key</Label>
              <Input
                type="password"
                value={form.auth_header_value ?? ""}
                placeholder={editing?.has_auth_header_value ? "••• (manter atual)" : "Bearer xxxxx ou chave"}
                onChange={(e) => setForm({ ...form, auth_header_value: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Frequência</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v as ApiIntegrationInput["frequency"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Headers adicionais (JSON)</Label>
            <Textarea
              value={extraHeadersText}
              onChange={(e) => setExtraHeadersText(e.target.value)}
              placeholder='{"X-Tenant": "abc"}'
              rows={3}
              className="font-mono text-xs"
            />
          </div>

          {form.http_method === "POST" && (
            <div className="space-y-1.5">
              <Label>Body template (JSON)</Label>
              <Textarea
                value={bodyTemplateText}
                onChange={(e) => setBodyTemplateText(e.target.value)}
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapeamento de campos</CardTitle>
              <CardDescription>
                Informe os caminhos JSON para extrair cada campo do PCM. Ex: <code>data.vehicles</code>{" "}
                para a lista, e <code>brand</code>, <code>price</code> etc. para cada campo dentro de
                um item.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Caminho da lista (list_path)</Label>
                <Input
                  value={form.field_mapping.list_path}
                  placeholder="data.vehicles"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      field_mapping: { ...form.field_mapping, list_path: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["brand", "Marca"],
                    ["model", "Modelo"],
                    ["version", "Versão"],
                    ["year_model", "Ano / Modelo"],
                    ["km", "KM"],
                    ["price", "Valor"],
                    ["link", "Link do anúncio"],
                    ["photo", "Foto"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input
                      value={form.field_mapping.fields[key] ?? ""}
                      placeholder={key}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          field_mapping: {
                            ...form.field_mapping,
                            fields: { ...form.field_mapping.fields, [key]: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiIntegrationLogs() {
  const { data: logs } = useApiIntegrationLogs();
  const rows = useMemo(() => logs ?? [], [logs]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de execuções</CardTitle>
        <CardDescription>Últimas 100 execuções de todas as integrações.</CardDescription>
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Sem execuções registradas.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Recebidos</TableHead>
                <TableHead>Importados</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => {
                const b = STATUS_BADGE[l.status] ?? STATUS_BADGE.failed;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">
                      {new Date(l.started_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge className={b.className} variant="outline">{b.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{l.http_status ?? "—"}</TableCell>
                    <TableCell className="text-sm">{l.vehicles_received}</TableCell>
                    <TableCell className="text-sm">{l.vehicles_imported}</TableCell>
                    <TableCell className="text-sm">
                      {l.duration_ms != null ? `${(l.duration_ms / 1000).toFixed(1)}s` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {l.error_message ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
