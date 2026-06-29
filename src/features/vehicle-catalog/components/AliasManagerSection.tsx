import { useMemo, useState } from "react";
import { Loader2, Link2Off, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import {
  useAliases, useCreateAlias, useDeleteAlias, useUnlinkAlias, useVehicleCatalog,
} from "../hooks";

export function AliasManagerSection() {
  const { data: catalog } = useVehicleCatalog();
  const { data: aliases, isLoading } = useAliases();
  const create = useCreateAlias();
  const unlink = useUnlinkAlias();
  const remove = useDeleteAlias();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ master_catalog_id: string; alias: string }>({
    master_catalog_id: "",
    alias: "",
  });

  const selected = useMemo(
    () => (catalog ?? []).find((c) => c.id === form.master_catalog_id) ?? null,
    [catalog, form.master_catalog_id],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aliases ?? [];
    return (aliases ?? []).filter((a) =>
      [a.brand, a.alias, a.canonical].join(" ").toLowerCase().includes(q),
    );
  }, [aliases, query]);

  const submit = async () => {
    if (!selected || !form.alias.trim()) return;
    await create.mutateAsync({
      brand: selected.brand,
      alias: form.alias.trim(),
      canonical: selected.canonical_model,
      master_catalog_id: selected.id,
    });
    setForm({ master_catalog_id: "", alias: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aliases vinculados ao catálogo</CardTitle>
        <CardDescription>
          Selecione um modelo canônico e cadastre variações para normalização.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <Label>Modelo canônico</Label>
            <Select
              value={form.master_catalog_id}
              onValueChange={(v) => setForm((f) => ({ ...f, master_catalog_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {(catalog ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.brand} {c.canonical_model}{c.canonical_version ? ` ${c.canonical_version}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Alias (como aparece no estoque/concorrente)</Label>
            <Input
              placeholder="ex.: NMAX, CB 500, NXR Bros…"
              value={form.alias}
              onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
            />
          </div>
          <Button onClick={submit} disabled={!selected || !form.alias.trim() || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Vincular
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alias…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Badge variant="secondary">{filtered.length} aliases</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhum alias cadastrado"
            description="Vincule a primeira variação a um modelo canônico."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Canônico</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.brand}</TableCell>
                    <TableCell className="font-medium">{a.alias}</TableCell>
                    <TableCell>{a.canonical}</TableCell>
                    <TableCell>
                      {a.master_catalog_id ? (
                        <Badge>Vinculado</Badge>
                      ) : (
                        <Badge variant="destructive">Órfão</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {a.master_catalog_id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Remover vínculo"
                            onClick={() => unlink.mutate(a.id)}
                          >
                            <Link2Off className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir alias"
                          onClick={() => {
                            if (confirm(`Excluir alias "${a.alias}"?`)) remove.mutate(a.id);
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
        )}
      </CardContent>
    </Card>
  );
}
