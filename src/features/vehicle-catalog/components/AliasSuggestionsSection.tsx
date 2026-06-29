import { useState } from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { useAliasSuggestions, useCreateAlias } from "../hooks";
import type { AliasSuggestion } from "../types";

export function AliasSuggestionsSection() {
  const q = useAliasSuggestions();
  const create = useCreateAlias();
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const key = (s: AliasSuggestion) => `${s.brand}|${s.alias}|${s.master_catalog_id}`;

  const approve = async (s: AliasSuggestion) => {
    await create.mutateAsync({
      brand: s.brand,
      alias: s.alias,
      canonical: s.canonical,
      master_catalog_id: s.master_catalog_id,
    });
    setApproved((prev) => new Set(prev).add(key(s)));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Sugestões de aliases</CardTitle>
          <CardDescription>
            O sistema analisa Meu Estoque e Concorrentes e sugere vínculos. Nada é aplicado automaticamente.
          </CardDescription>
        </div>
        <Button onClick={() => q.refetch()} disabled={q.isFetching}>
          {q.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Sugerir aliases
        </Button>
      </CardHeader>
      <CardContent>
        {!q.data && !q.isFetching ? (
          <EmptyState
            icon={Sparkles}
            title="Sem sugestões ainda"
            description="Clique em 'Sugerir aliases' para gerar a análise."
          />
        ) : q.isFetching ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : q.data && q.data.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Nenhuma sugestão encontrada"
            description="Todos os modelos detectados já estão cobertos pelo catálogo."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Alias detectado</TableHead>
                  <TableHead>Sugestão canônica</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Ocorrências</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data ?? []).map((s) => {
                  const k = key(s);
                  const done = approved.has(k);
                  return (
                    <TableRow key={k}>
                      <TableCell>{s.brand}</TableCell>
                      <TableCell className="font-medium">{s.alias}</TableCell>
                      <TableCell>{s.canonical}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{s.occurrences}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={done ? "secondary" : "default"}
                          disabled={done || create.isPending}
                          onClick={() => approve(s)}
                        >
                          {done ? <Check className="h-4 w-4" /> : "Aprovar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
