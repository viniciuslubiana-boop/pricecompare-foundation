import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Radar, Loader2 } from "lucide-react";
import {
  useSelectSource,
  useSourceHistory,
  computeSourceQuality,
  type SourceQuality,
  type SourceHistoryRow,
} from "@/features/smart-source";

export const Route = createFileRoute("/_authenticated/diagnostico-fonte")({
  component: DiagnosticoFontePage,
});

const QUALITY_VARIANT: Record<
  SourceQuality,
  "default" | "secondary" | "outline" | "destructive"
> = {
  excelente: "default",
  boa: "secondary",
  regular: "outline",
  ruim: "destructive",
  indefinida: "outline",
};

function DiagnosticoFontePage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const select = useSelectSource();
  const { data: history = [], isLoading } = useSourceHistory();

  const quality = useMemo(
    () => computeSourceQuality(history as SourceHistoryRow[]),
    [history],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    select.mutate({ companyType: "competitor", url: url.trim() });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico da Fonte"
        description="Decisão automática da melhor fonte de dados pelo Smart Source Selector."
      />

      <Card>
        <CardHeader>
          <CardTitle>Selecionar fonte</CardTitle>
          <CardDescription>
            Informe nome e URL. O PCM decide automaticamente o método.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-3 md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Empresa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com.br"
                required
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={select.isPending}>
                {select.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Decidindo…
                  </>
                ) : (
                  "Decidir fonte"
                )}
              </Button>
              {select.data && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{select.data.chosen.method}</Badge>
                    <Badge variant="secondary">{select.data.technology}</Badge>
                    <span className="text-muted-foreground">
                      confiança {select.data.chosen.confidence.toFixed(0)}% • prioridade {select.data.chosen.priority} • motivo: {select.data.chosen.reason}
                    </span>
                    {select.data.usedHistory && (
                      <Badge variant="outline">histórico aplicado</Badge>
                    )}
                  </div>
                  {select.data.fallbackChain.length > 0 && (
                    <div className="text-muted-foreground">
                      Métodos rejeitados / fallback:{" "}
                      {select.data.fallbackChain
                        .map((c) => `${c.method} (${c.confidence.toFixed(0)}%)`)
                        .join(" → ")}
                    </div>
                  )}
                  {select.data.scores && select.data.scores.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Scores conhecidos:{" "}
                      {select.data.scores
                        .map(
                          (s) =>
                            `${s.method} ${Math.round(s.score)} (sucesso ${Math.round(s.successRate * 100)}%, ${s.executions} exec)`,
                        )
                        .join(" • ")}
                    </div>
                  )}
                </div>
              )}

            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualidade da Fonte</CardTitle>
          <CardDescription>
            Indicador agregado calculado a partir do histórico recente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant={QUALITY_VARIANT[quality.quality]} className="capitalize">
            {quality.quality}
          </Badge>
          <span className="text-sm text-muted-foreground">
            taxa de sucesso {(quality.successRate * 100).toFixed(0)}% • média {quality.avgVehicles.toFixed(0)} veículos • {Math.round(quality.avgTimeMs)} ms • {quality.samples} amostras
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de sincronizações</CardTitle>
          <CardDescription>
            Registrado em <code>market_source_history</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Confiança</TableHead>
                <TableHead className="text-right">Veículos</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead>Fallback</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : (history as SourceHistoryRow[]).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={Radar}
                      title="Sem sincronizações ainda"
                      description="Execuções aparecem aqui assim que o MAE rodar."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                (history as SourceHistoryRow[]).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[240px] truncate">{r.url}</TableCell>
                    <TableCell>
                      {r.company_type === "base_company" ? "Empresa Base" : "Concorrente"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.method_used}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(r.confidence).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right">{r.vehicles_found}</TableCell>
                    <TableCell className="text-right">
                      {r.execution_time_ms ?? "—"} ms
                    </TableCell>
                    <TableCell>{r.fallback_used ? "Sim" : "Não"}</TableCell>
                    <TableCell>
                      <Badge variant={r.success ? "default" : "destructive"}>
                        {r.success ? "Sucesso" : "Falha"}
                      </Badge>
                    </TableCell>
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
