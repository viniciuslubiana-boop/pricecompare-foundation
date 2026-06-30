import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { downloadVehiclesCsv, downloadVehiclesXlsx, type ExportVehicleRow } from "@/lib/export-vehicles";
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
import { Download, ExternalLink, FileSearch, FileSpreadsheet, Loader2, Save } from "lucide-react";
import {
  discoverInventoryRoute,
  listHtmlIntelligenceRuns,
  type DiscoverRoutesPayload,
} from "@/lib/html-intelligence.functions";
import {
  saveSynchronizedStock,
  listSaveTargets,
  logPostProcess,
  type SaveStockResult,
} from "@/lib/save-stock.functions";
import { runPostProcessAfterSave } from "@/features/html-intelligence/utils/post-process";
import { analyticsKeys } from "@/features/analytics";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboardData";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
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
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveStockResult | null>(null);
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const discoverFn = useServerFn(discoverInventoryRoute);
  const listFn = useServerFn(listHtmlIntelligenceRuns);
  const targetsFn = useServerFn(listSaveTargets);
  const saveFn = useServerFn(saveSynchronizedStock);
  const logPostFn = useServerFn(logPostProcess);


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
    suspectedDrop?: boolean;
    confirmSuspectedDrop?: boolean;
  };

  const save = useMutation({
    mutationFn: (input: SaveInput) => saveFn({ data: input }),
    onSuccess: async (res, vars) => {
      setSaveResult(res);
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["competitor-vehicles"] });

      if (res.errors.length === 0) {
        toast.success(`Estoque sincronizado: ${res.totalSaved} novos, ${res.totalUpdated} atualizados`);
      } else {
        toast.warning(`Salvo com avisos: ${res.errors.length} erro(s)`);
      }

      // Pós-processamento automático: Comparison → Analytics → Dashboard.
      // Falhas aqui NÃO desfazem o salvamento.
      try {
        const post = await runPostProcessAfterSave({
          companyType: vars.companyType,
          companyId: vars.companyId,
        });

        queryClient.invalidateQueries({ queryKey: ["comparisons"] });
        queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        queryClient.invalidateQueries({ queryKey: ["global-search"] });
        queryClient.invalidateQueries({ queryKey: ["market-changes"] });
        queryClient.invalidateQueries({ queryKey: ["vehicle-360"] });

        if (res.logId) {
          await logPostFn({ data: { logId: res.logId, metadata: post } }).catch(() => null);
        }

        if (post.status === "success") {
          toast.success("Estoque salvo e comparações atualizadas.");
        } else if (post.status === "partial") {
          toast.warning("Estoque salvo. Algumas comparações falharam.");
        } else {
          toast.error("Estoque salvo, mas houve falha ao atualizar as comparações. Verifique o diagnóstico.");
        }

        if (post.noEquivalenceWarning) {
          toast.warning(post.noEquivalenceWarning);
        }

      } catch (e) {
        toast.error("Estoque salvo, mas houve falha ao atualizar as comparações. Verifique o diagnóstico.", {
          description: e instanceof Error ? e.message : undefined,
        });
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

      {data?.recovery && !data.rateLimited && (
        <Card>
          <CardHeader>
            <CardTitle>Recuperação & Aprendizado</CardTitle>
            <CardDescription>
              Caminho executado pelo MAE para esta URL. O método final pode diferir do inicial quando há fallback automático.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Inicial: {data.recovery.initialMethod}</Badge>
              <Badge variant={data.recovery.recovered ? "default" : "secondary"}>
                Final: {data.recovery.finalMethod}
              </Badge>
              {data.recovery.fallbackUsed && (
                <Badge variant="secondary">Fallback usado</Badge>
              )}
              {data.recovery.recovered && (
                <Badge variant="default">Recuperado ✓</Badge>
              )}
              {data.suspectedDrop && (
                <Badge variant="destructive">Queda brusca suspeita</Badge>
              )}
              {data.priorAvgVehicles > 0 && (
                <Badge variant="outline">
                  Média histórica {Math.round(data.priorAvgVehicles)}
                </Badge>
              )}
            </div>
            {data.recovery.fallbackReason && (
              <p className="text-xs text-muted-foreground">
                Motivo: {data.recovery.fallbackReason}
              </p>
            )}
            {data.suspectedDrop && data.suddenDropReason && (
              <p className="text-xs text-destructive">
                ⚠ {data.suddenDropReason}. Estoque anterior preservado — confirme manualmente para sobrescrever.
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
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="default">
                    Inventory {chosen.inventoryScore?.score ?? 0}
                  </Badge>
                  <Badge variant={scoreBadgeVariant(chosen.breakdown?.score ?? 0)}>
                    HTML {chosen.breakdown?.score ?? 0}
                  </Badge>
                  {chosen.priorityBoost && <Badge variant="secondary">URL informada</Badge>}
                  <span className="text-muted-foreground">
                    {chosen.vehiclesEstimated} veículos estimados • {chosen.htmlLength.toLocaleString("pt-BR")} bytes
                  </span>
                  <a href={chosen.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    abrir página
                  </a>
                </div>
                {data.result.chosenReason && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Motivo da escolha:</span> {data.result.chosenReason}
                  </p>
                )}
              </div>
            )}


            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Inv.</TableHead>
                  <TableHead className="text-right">HTML</TableHead>
                  <TableHead className="text-right">Veículos</TableHead>
                  <TableHead className="text-right">Preços</TableHead>
                  <TableHead className="text-right">Cards</TableHead>
                  <TableHead>Motivo / Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c: InventoryRouteCandidate) => (
                  <TableRow key={c.url}>
                    <TableCell className="font-mono text-xs">
                      {c.path}
                      {c.priorityBoost && <Badge variant="secondary" className="ml-1">user</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{c.status ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={scoreBadgeVariant(c.inventoryScore?.score ?? 0)}>
                        {c.inventoryScore?.score ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={scoreBadgeVariant(c.breakdown?.score ?? 0)}>
                        {c.breakdown?.score ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.vehiclesEstimated}</TableCell>
                    <TableCell className="text-right">{c.breakdown?.priceHits ?? 0}</TableCell>
                    <TableCell className="text-right">{c.breakdown?.cardLikeContainers ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                      {c.error ?? c.rejectionReason ?? "—"}
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

            {data.preview.quality && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={scoreBadgeVariant(data.preview.quality.qualityScore)}>
                    Extractor Quality {data.preview.quality.qualityScore}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {data.preview.quality.total} itens avaliados
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                  <div>Preço: <b>{data.preview.quality.pctPrice}%</b></div>
                  <div>Ano: <b>{data.preview.quality.pctYear}%</b></div>
                  <div>KM: <b>{data.preview.quality.pctKm}%</b></div>
                  <div>Título: <b>{data.preview.quality.pctTitle}%</b></div>
                  <div>Link: <b>{data.preview.quality.pctLink}%</b></div>
                  <div>Imagem: <b>{data.preview.quality.pctImage}%</b></div>
                </div>
                {data.preview.quality.missingFields.length > 0 && (
                  <p className="text-xs text-destructive">
                    Campos críticos ausentes: {data.preview.quality.missingFields.join(", ")}
                  </p>
                )}
                {data.preview.quality.recommendations.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc pl-4">
                    {data.preview.quality.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            )}


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
              {(() => {
                const t = data.normalization.telemetry;
                const labels: Record<typeof t.status, string> = {
                  idle: "Aguardando",
                  sending: "Enviando",
                  processing: "Processando",
                  success: "Sucesso",
                  timeout: "Timeout",
                  gateway_error: "Erro de gateway",
                  invalid_json: "JSON inválido",
                  empty_response: "Resposta vazia",
                  validation_failed: "Validação falhou",
                  missing_key: "Sem credencial",
                };
                const ok = t.status === "success";
                return (
                  <Badge variant={ok ? "default" : "destructive"}>
                    Status IA: {labels[t.status] ?? t.status}
                  </Badge>
                );
              })()}
              <Badge variant={data.normalization.aiUsed ? "default" : "outline"}>
                {data.normalization.aiUsed ? `Modelo ${data.normalization.aiModel}` : "IA não utilizada"}
              </Badge>
              <Badge variant="secondary">Confiança média {data.normalization.confidenceAvg}</Badge>
              <Badge variant="outline">Aprovados {data.normalization.statusCounts.approved}</Badge>
              <Badge variant="outline">Revisar {data.normalization.statusCounts.review}</Badge>
              <Badge variant="outline">Inválidos {data.normalization.statusCounts.invalid}</Badge>
              <Badge variant="outline">Duplicados {data.normalization.statusCounts.duplicated}</Badge>
              <span className="text-muted-foreground">
                {data.normalization.aiTokens} tokens • {data.normalization.aiDurationMs} ms •{" "}
                {data.normalization.telemetry.itemsSent} itens • {Math.round(data.normalization.telemetry.payloadBytes / 1024)} kB enviados
              </span>
            </div>

            {(data.normalization.errors.length > 0 || data.normalization.telemetry.errorDetail) && (
              <p className="text-xs text-destructive">
                {[data.normalization.telemetry.errorDetail, ...data.normalization.errors]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}

            {data.normalization.items.length > 0 && (() => {
              const list = companyType === "base_company"
                ? targets.data?.baseCompanies ?? []
                : targets.data?.competitors ?? [];
              const storeName = list.find((c) => c.id === companyId)?.name ?? "—";
              const tipo = companyType === "base_company" ? "Empresa Base" : "Concorrente";
              const exportRows: ExportVehicleRow[] = data.normalization.items.map((v) => ({
                loja: storeName,
                tipo,
                marca: v.brand,
                modelo: v.model,
                versao: v.version,
                ano: v.year_model,
                km: v.km,
                preco: v.price,
                link: v.source_url,
                imagem: v.image_url,
                fonte: v.source,
                status: v.status,
                confianca: v.confidenceAvg,
                data_coleta: new Date().toISOString(),
              }));
              const base = `estoque-${(storeName === "—" ? "varredura" : storeName).toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => downloadVehiclesCsv(exportRows, base)}>
                    <Download className="mr-2 size-4" /> Baixar CSV
                  </Button>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => downloadVehiclesXlsx(exportRows, base)}>
                    <FileSpreadsheet className="mr-2 size-4" /> Baixar Excel
                  </Button>
                </div>
              );
            })()}




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

            <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto] md:items-end pt-2 border-t">
              <div className="space-y-1">
                <Label>Destino</Label>
                <Select
                  value={companyType}
                  onValueChange={(v) => { setCompanyType(v as "base_company" | "competitor"); setCompanyId(""); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base_company">Empresa Base</SelectItem>
                    <SelectItem value="competitor">Concorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{companyType === "base_company" ? "Empresa Base" : "Concorrente"}</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(companyType === "base_company"
                      ? targets.data?.baseCompanies ?? []
                      : targets.data?.competitors ?? []
                    ).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Duplicados</Label>
                <Select value={duplicateStrategy} onValueChange={(v) => setDuplicateStrategy(v as "ignore" | "update" | "new")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Atualizar existente</SelectItem>
                    <SelectItem value="ignore">Ignorar</SelectItem>
                    <SelectItem value="new">Salvar como novo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                disabled={!companyId || save.isPending}
                onClick={() => {
                  if (data?.suspectedDrop) setDropDialogOpen(true);
                  else setConfirmOpen(true);
                }}
              >
                {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                Salvar Estoque Sincronizado
              </Button>

              <div className="md:col-span-4 flex items-center gap-2">
                <Checkbox
                  id="include-review"
                  checked={includeReview}
                  onCheckedChange={(v) => setIncludeReview(v === true)}
                />
                <Label htmlFor="include-review" className="text-sm font-normal cursor-pointer">
                  Incluir itens em revisão (confirmação manual)
                </Label>
              </div>
              {saveResult && (
                <div className="md:col-span-4 text-xs text-muted-foreground border rounded p-2">
                  Último salvamento: {saveResult.totalSaved} novos · {saveResult.totalUpdated} atualizados ·
                  {" "}{saveResult.totalSkipped} ignorados · {saveResult.totalInvalid} inválidos ·
                  {" "}{saveResult.totalReviewed} em revisão · {saveResult.durationMs} ms
                  {saveResult.errors.length > 0 && (
                    <div className="text-destructive mt-1">{saveResult.errors.join(" • ")}</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar salvamento</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <div>Destino: <strong>{companyType === "base_company" ? "Empresa Base" : "Concorrente"}</strong></div>
                <div>
                  {(() => {
                    const list = companyType === "base_company"
                      ? targets.data?.baseCompanies ?? []
                      : targets.data?.competitors ?? [];
                    const found = list.find((c) => c.id === companyId);
                    return <>Selecionado: <strong>{found?.name ?? "—"}</strong></>;
                  })()}
                </div>
                {data?.normalization && (
                  <ul className="text-xs space-y-1 pt-1">
                    <li>Total detectado: {data.normalization.items.length}</li>
                    <li>Aprovados: {data.normalization.statusCounts.approved}</li>
                    <li>Revisar: {data.normalization.statusCounts.review} {includeReview ? "(serão salvos)" : "(serão ignorados)"}</li>
                    <li>Inválidos: {data.normalization.statusCounts.invalid} (nunca salvos)</li>
                    <li>Duplicados: estratégia <strong>{duplicateStrategy}</strong></li>
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!data?.normalization || !companyId) return;
                save.mutate({
                  items: data.normalization.items,
                  companyType,
                  companyId,
                  sourceUrl: url || data.result.baseUrl,
                  duplicateStrategy,
                  includeReview,
                  suspectedDrop: false,
                  confirmSuspectedDrop: false,
                });
              }}

            >

              Confirmar e salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sprint 009 — Dialog dedicado para queda brusca suspeita */}
      <AlertDialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Queda brusca detectada</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  A sincronização encontrou uma queda brusca no estoque desta empresa.
                  Para proteger os dados, o PCM <strong>não substituirá o estoque anterior automaticamente</strong>.
                </p>
                {data && (
                  <ul className="text-xs space-y-1 border rounded p-2 bg-muted/30">
                    <li>Média histórica: <strong>{Math.round(data.priorAvgVehicles)}</strong> veículos</li>
                    <li>Encontrados agora: <strong>{data.preview?.rawAfter ?? 0}</strong></li>
                    <li>Método utilizado: <strong>{data.recovery?.finalMethod ?? "—"}</strong></li>
                    <li>Motivo da suspeita: <em>{data.suddenDropReason ?? "—"}</em></li>
                  </ul>
                )}
                {!isAdmin && (
                  <p className="text-destructive text-xs">
                    Apenas administradores podem confirmar a substituição.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setDropDialogOpen(false);
                toast.info("Estoque anterior mantido. Nenhuma alteração foi feita.");
              }}
            >
              Manter estoque anterior
            </Button>
            <AlertDialogAction
              disabled={!isAdmin}
              onClick={() => {
                if (!data?.normalization || !companyId || !isAdmin) return;
                save.mutate({
                  items: data.normalization.items,
                  companyType,
                  companyId,
                  sourceUrl: url || data.result.baseUrl,
                  duplicateStrategy,
                  includeReview,
                  suspectedDrop: true,
                  confirmSuspectedDrop: true,
                });
              }}
            >
              Confirmar substituição mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sprint 010 — Checklist de pós-processamento (dados reais do servidor) */}
      {data && !data.rateLimited && (() => {
        const post = saveResult ? !saveResult.protected && saveResult.errors.length === 0 : false;
        const checks: Array<{ label: string; ok: boolean }> = [
          { label: "Rota encontrada", ok: !!data.result.chosen },
          { label: "Preview técnico gerado", ok: !!data.preview },
          { label: "Preview normalizado gerado", ok: !!data.normalization },
          { label: "Destino selecionado", ok: !!companyId },
          { label: "Deduplicação validada", ok: !!data.normalization },
          { label: "Override servidor-side validado (admin-only)", ok: !data.suspectedDrop || (!!saveResult && !saveResult.protected) },
          { label: "Salvamento concluído", ok: !!saveResult && !saveResult.protected && (saveResult.totalSaved + saveResult.totalUpdated) > 0 },
          { label: "Pós-processamento executado", ok: post },
          { label: "Comparações atualizadas", ok: post },
          { label: "Dashboard invalidado", ok: post },
          { label: "Consulta global invalidada", ok: post },
          { label: "Histórico/alertas atualizados", ok: post },
          { label: "Proteção aplicada quando necessário", ok: !data.suspectedDrop || !!saveResult?.protected || (!!saveResult && saveResult.totalSaved + saveResult.totalUpdated > 0) },
        ];
        return (
          <Card>
            <CardHeader>
              <CardTitle>Homologação do MAE</CardTitle>
              <CardDescription>Checklist real do fluxo de sincronização (dados retornados pelo servidor).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="grid gap-2 md:grid-cols-2 text-sm">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2">
                    <span aria-hidden className={c.ok ? "text-green-600" : "text-muted-foreground"}>
                      {c.ok ? "✓" : "○"}
                    </span>
                    <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                <div className="font-medium text-foreground">Cenários de homologação</div>
                <div><strong>A.</strong> Concorrente com HTML normal → rota + preview + normalização + salvamento + comparação + dashboard.</div>
                <div><strong>B.</strong> Site com queda brusca → queda detectada, estoque anterior preservado, override apenas por admin (validado no servidor).</div>
                <div><strong>C.</strong> Empresa Base → salva em <code>my_vehicles</code>, sem misturar com <code>competitor_vehicles</code>, comparação recalculada.</div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Sprint 009 — Relatório da Sincronização */}
      {saveResult && data && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório da Sincronização</CardTitle>
            <CardDescription>Resumo consolidado do último ciclo MAE.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {saveResult.protected && (
              <div className="rounded border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-700">
                <strong>Proteção aplicada:</strong> {saveResult.protectionReason}
              </div>
            )}
            <dl className="grid gap-x-6 gap-y-1 text-sm md:grid-cols-2">
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Empresa</dt>
                <dd className="font-medium">
                  {(() => {
                    const list = companyType === "base_company"
                      ? targets.data?.baseCompanies ?? []
                      : targets.data?.competitors ?? [];
                    return list.find((c) => c.id === companyId)?.name ?? "—";
                  })()}
                </dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="font-mono text-xs truncate max-w-[60%]">{url || data.result.baseUrl}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Método inicial</dt>
                <dd>{data.recovery?.initialMethod ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Método final</dt>
                <dd>{data.recovery?.finalMethod ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Source Score</dt>
                <dd>{data.score?.sourceScore ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">HTML Score</dt>
                <dd>{data.score?.htmlScore ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Veículos brutos</dt>
                <dd>{data.preview?.rawAfter ?? 0}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Normalizados</dt>
                <dd>{data.normalization?.items.length ?? 0}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Aprovados</dt>
                <dd>{data.normalization?.statusCounts.approved ?? 0}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Em revisão</dt>
                <dd>{data.normalization?.statusCounts.review ?? 0}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Inválidos</dt>
                <dd>{data.normalization?.statusCounts.invalid ?? 0}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Salvos (novos)</dt>
                <dd>{saveResult.totalSaved}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Atualizados</dt>
                <dd>{saveResult.totalUpdated}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Duplicados</dt>
                <dd>{saveResult.totalDuplicated}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Pós-processamento</dt>
                <dd>{saveResult.protected ? "bloqueado (proteção)" : saveResult.errors.length === 0 ? "concluído" : "com avisos"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Duração total</dt>
                <dd>{saveResult.durationMs} ms</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">Status final</dt>
                <dd>
                  <Badge variant={saveResult.protected ? "outline" : saveResult.errors.length > 0 ? "secondary" : "default"}>
                    {saveResult.protected ? "Protegido" : saveResult.errors.length > 0 ? "Parcial" : "Sucesso"}
                  </Badge>
                </dd>
              </div>
            </dl>
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
