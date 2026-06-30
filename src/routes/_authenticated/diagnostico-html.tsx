import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FileSearch, Loader2 } from "lucide-react";
import {
  discoverInventoryRoute,
  listHtmlIntelligenceRuns,
  type DiscoverRoutesPayload,
} from "@/lib/html-intelligence.functions";
import type {
  HtmlIntelligenceRunRow,
  InventoryRouteCandidate,
} from "@/features/html-intelligence";

export const Route = createFileRoute("/_authenticated/diagnostico-html")({
  component: DiagnosticoHtmlPage,
});

function scoreBadgeVariant(score: number): "default" | "secondary" | "outline" | "destructive" {
  if (score >= 70) return "default";
  if (score >= 40) return "secondary";
  if (score > 0) return "outline";
  return "destructive";
}

function DiagnosticoHtmlPage() {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();
  const discoverFn = useServerFn(discoverInventoryRoute);
  const listFn = useServerFn(listHtmlIntelligenceRuns);

  const history = useQuery({
    queryKey: ["html-intelligence-runs"],
    queryFn: () => listFn(),
  });

  const discover = useMutation({
    mutationFn: (input: { url: string }) => discoverFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["html-intelligence-runs"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    discover.mutate({ url: url.trim() });
  }

  const data: DiscoverRoutesPayload | undefined = discover.data;
  const chosen = data?.result.chosen ?? null;
  const candidates = data?.result.candidates ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico HTML"
        description="Descoberta automática da melhor rota de estoque e cálculo de HTML Score."
      />

      <Card>
        <CardHeader>
          <CardTitle>Investigar empresa</CardTitle>
          <CardDescription>
            Informe a URL principal. O HIE testa rotas candidatas e pontua cada uma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="url">URL principal</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com.br"
                required
              />
            </div>
            <Button type="submit" disabled={discover.isPending}>
              {discover.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Analisando…
                </>
              ) : (
                "Descobrir rota"
              )}
            </Button>
          </form>

          {discover.error && (
            <p className="mt-4 text-sm text-destructive">
              {discover.error instanceof Error
                ? discover.error.message
                : "Falha ao executar o HIE."}
            </p>
          )}
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              {chosen
                ? `Melhor rota: ${chosen.path}`
                : "Nenhuma rota candidata atingiu pontuação suficiente."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chosen && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={scoreBadgeVariant(chosen.breakdown?.score ?? 0)}>
                  Score {chosen.breakdown?.score ?? 0}
                </Badge>
                <span className="text-muted-foreground">
                  {chosen.vehiclesEstimated} veículos estimados • {chosen.htmlLength.toLocaleString("pt-BR")} bytes
                </span>
                <a
                  href={chosen.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  abrir página
                </a>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Veículos</TableHead>
                  <TableHead className="text-right">Preços</TableHead>
                  <TableHead className="text-right">Cards</TableHead>
                  <TableHead className="text-right">Bytes</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c: InventoryRouteCandidate) => (
                  <TableRow key={c.url}>
                    <TableCell className="font-mono text-xs">{c.path}</TableCell>
                    <TableCell className="text-right">{c.status ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={scoreBadgeVariant(c.breakdown?.score ?? 0)}>
                        {c.breakdown?.score ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.vehiclesEstimated}</TableCell>
                    <TableCell className="text-right">
                      {c.breakdown?.priceHits ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.breakdown?.cardLikeContainers ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.htmlLength.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                      {c.error ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico recente</CardTitle>
          <CardDescription>
            Últimas 50 execuções persistidas em <code>html_intelligence_runs</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Veículos</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : (history.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={FileSearch}
                      title="Sem execuções ainda"
                      description="Rode uma descoberta acima para popular o histórico."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                (history.data ?? []).map((r: HtmlIntelligenceRunRow) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[260px] truncate">{r.base_url}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.chosen_route ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={scoreBadgeVariant(r.chosen_score)}>
                        {r.chosen_score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{r.vehicles_estimated}</TableCell>
                    <TableCell className="text-right">{r.processing_ms} ms</TableCell>
                    <TableCell>
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
