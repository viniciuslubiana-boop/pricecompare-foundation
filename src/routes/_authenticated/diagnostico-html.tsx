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
import { FileSearch, Loader2, Save } from "lucide-react";
import {
  discoverInventoryRoute,
  listHtmlIntelligenceRuns,
  type DiscoverRoutesPayload,
} from "@/lib/html-intelligence.functions";
import {
  saveSynchronizedStock,
  listSaveTargets,
  type SaveStockResult,
} from "@/lib/save-stock.functions";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type {
  HtmlIntelligenceRunRow,
  InventoryRouteCandidate,
  NormalizedVehiclePreview,
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
  const [companyType, setCompanyType] = useState<"base_company" | "competitor">("competitor");
  const [companyId, setCompanyId] = useState<string>("");
  const [duplicateStrategy, setDuplicateStrategy] = useState<"ignore" | "update" | "new">("update");
  const [includeReview, setIncludeReview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveStockResult | null>(null);
  const queryClient = useQueryClient();
  const discoverFn = useServerFn(discoverInventoryRoute);
  const listFn = useServerFn(listHtmlIntelligenceRuns);
  const targetsFn = useServerFn(listSaveTargets);
  const saveFn = useServerFn(saveSynchronizedStock);

  const history = useQuery({
    queryKey: ["html-intelligence-runs"],
    queryFn: () => listFn(),
  });

  const targets = useQuery({
    queryKey: ["save-stock-targets"],
    queryFn: () => targetsFn(),
  });

  const discover = useMutation({
    mutationFn: (input: { url: string }) => discoverFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["html-intelligence-runs"] });
    },
  });

  type SaveInput = {
    items: NormalizedVehiclePreview[];
    companyType: "base_company" | "competitor";
    companyId: string;
    sourceUrl?: string | null;
    duplicateStrategy: "ignore" | "update" | "new";
    includeReview: boolean;
  };
  const save = useMutation({
    mutationFn: (input: SaveInput) => saveFn({ data: input }),
    onSuccess: (res) => {
      setSaveResult(res);
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["competitor-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (res.errors.length === 0) {
        toast.success(`Estoque sincronizado: ${res.totalSaved} novos, ${res.totalUpdated} atualizados`);
      } else {
        toast.warning(`Salvo com avisos: ${res.errors.length} erro(s)`);
      }
    },
    onError: (e: Error) => toast.error("Falha ao salvar", { description: e.message }),
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

      {data?.rateLimited && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-amber-600">Execução bloqueada</CardTitle>
            <CardDescription>{data.rateLimitMessage}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {data?.score && (
        <Card>
          <CardHeader>
            <CardTitle>Qualidade da Fonte</CardTitle>
            <CardDescription>
              Source Score consolidado da execução atual. Sem IA, sem persistência de veículos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={scoreBadgeVariant(data.score.sourceScore)}>
                Source Score {data.score.sourceScore}
              </Badge>
              <Badge variant="outline">HTML {data.score.htmlScore}</Badge>
              <Badge variant="outline">Cobertura {data.score.coverageScore}</Badge>
              <Badge variant="outline">Qualidade {data.score.qualityScore}</Badge>
              <Badge variant="outline">Performance {data.score.performanceScore}</Badge>
              <Badge variant="outline">Estabilidade {data.score.stabilityScore}</Badge>
              <Badge variant="secondary">
                Sucesso {Math.round(data.score.successRate * 100)}%
              </Badge>
            </div>
            {data.score.notes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {data.score.notes.join(" • ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {data && !data.rateLimited && (

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

      {data?.preview && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia Técnica da Extração</CardTitle>
            <CardDescription>
              Detectores executados sobre a melhor rota. Sem IA, sem persistência de veículos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge>{data.preview.cardsDetected} cards</Badge>
              <Badge variant="secondary">JSON {data.preview.jsonItems}</Badge>
              <Badge variant="secondary">HTML {data.preview.htmlItems}</Badge>
              <Badge variant="secondary">Schema.org {data.preview.structuredItems}</Badge>
              <Badge variant={data.preview.actionsUsed ? "default" : "outline"}>
                {data.preview.actionsUsed ? "Firecrawl actions" : "HTML simples"}
              </Badge>
              {data.preview.actionsUsed && (
                <span className="text-muted-foreground">
                  scroll x{data.preview.scrollCycles} • load more x{data.preview.loadMoreClicks}
                </span>
              )}
              <span className="text-muted-foreground">
                antes {data.preview.rawBefore} → depois {data.preview.rawAfter} • {data.preview.processingMs} ms
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Paginação:{" "}
                {data.preview.pagination.detected
                  ? data.preview.pagination.nextPageUrl ?? "detectada"
                  : "não"}
              </span>
              <span>
                Load more:{" "}
                {data.preview.loadMore.detected
                  ? data.preview.loadMore.label ?? "detectado"
                  : "não"}
              </span>
              <span>Scroll infinito: {data.preview.scroll.detected ? "sim" : "não"}</span>
              <span>
                JSON interno:{" "}
                {data.preview.embeddedJsonSources.length > 0
                  ? data.preview.embeddedJsonSources.join(", ")
                  : "não"}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Conf.</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.preview.preview.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Nenhum item bruto identificado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.preview.preview.map((item, idx) => (
                    <TableRow key={`${item.link ?? "no-link"}-${idx}`}>
                      <TableCell className="max-w-[260px] truncate">
                        {item.title ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.price ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.year ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.km ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.confidence}</TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            abrir
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data?.normalization && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia Normalizada</CardTitle>
            <CardDescription>
              Veículos interpretados pela IA + normalização PCM + Catálogo Mestre. Nada é salvo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={data.normalization.aiUsed ? "default" : "destructive"}>
                {data.normalization.aiUsed ? `IA ${data.normalization.aiModel}` : "IA indisponível"}
              </Badge>
              <Badge variant="secondary">Confiança média {data.normalization.confidenceAvg}</Badge>
              <Badge variant="outline">Aprovados {data.normalization.statusCounts.approved}</Badge>
              <Badge variant="outline">Revisar {data.normalization.statusCounts.review}</Badge>
              <Badge variant="outline">Inválidos {data.normalization.statusCounts.invalid}</Badge>
              <Badge variant="outline">Duplicados {data.normalization.statusCounts.duplicated}</Badge>
              <span className="text-muted-foreground">
                {data.normalization.aiTokens} tokens • {data.normalization.aiDurationMs} ms
              </span>
            </div>

            {data.normalization.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {data.normalization.errors.join(" • ")}
              </p>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead className="text-right">KM</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Imagem</TableHead>
                  <TableHead className="text-right">Conf.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.normalization.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
                      Sem veículos normalizados.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.normalization.items.map((v, idx) => (
                    <TableRow key={`${v.source_url ?? "no-link"}-${idx}`}>
                      <TableCell>{v.brand ?? "—"}</TableCell>
                      <TableCell>{v.model ?? "—"}</TableCell>
                      <TableCell className="text-xs">{v.version ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{v.year_model ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {v.km != null ? v.km.toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {v.price != null
                          ? v.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {v.source_url ? (
                          <a
                            href={v.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-xs"
                          >
                            abrir
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {v.image_url ? (
                          <a
                            href={v.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-xs"
                          >
                            ver
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{v.confidenceAvg}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            v.status === "approved"
                              ? "default"
                              : v.status === "review"
                              ? "secondary"
                              : v.status === "duplicated"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {v.status === "approved"
                            ? "Aprovado"
                            : v.status === "review"
                            ? "Revisar"
                            : v.status === "duplicated"
                            ? "Duplicado"
                            : "Inválido"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {v.observations.length > 0 ? v.observations.join("; ") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
