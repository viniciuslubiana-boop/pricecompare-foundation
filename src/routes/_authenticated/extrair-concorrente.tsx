import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Play, Save } from "lucide-react";
import { useCompetitorsList } from "@/features/competitors/hooks/useCompetitors";
import { useExtraction } from "@/features/extraction/hooks/useExtraction";
import { ExtractionPreviewTable } from "@/features/extraction/components/ExtractionPreviewTable";

export const Route = createFileRoute("/_authenticated/extrair-concorrente")({
  head: () => ({ meta: [{ title: "Extrair Concorrente · PriceCompare" }] }),
  component: ExtrairConcorrentePage,
});

function ExtrairConcorrentePage() {
  const { data: competitors = [], isLoading: loadingCompetitors } = useCompetitorsList({
    status: "active",
  });
  const [competitorId, setCompetitorId] = useState<string>("");
  const [inputType, setInputType] = useState<"text" | "html">("text");
  const [rawContent, setRawContent] = useState("");

  const { preview, runPreview, isProcessing, updateRow, removeRow, reset, confirm, isConfirming } =
    useExtraction();

  const selected = useMemo(
    () => competitors.find((c) => c.id === competitorId) ?? null,
    [competitors, competitorId],
  );

  const canProcess = !!competitorId && rawContent.trim().length >= 10 && !isProcessing;
  const validCount = preview?.totals.valid ?? 0;

  function handleProcess() {
    if (!selected) return;
    runPreview({
      competitorId: selected.id,
      competitorName: selected.name,
      competitorUrl: selected.url ?? null,
      rawContent,
      inputType,
    });
  }

  function handleConfirm() {
    if (!selected) return;
    confirm({
      competitorId: selected.id,
      competitorName: selected.name,
      competitorUrl: selected.url ?? null,
    });
  }

  function handleReset() {
    reset();
    setRawContent("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrair Concorrente"
        description="Cole texto ou HTML de uma página de concorrente para gerar um preview de veículos. Nada é salvo sem sua confirmação."
        actions={
          <Button onClick={handleProcess} disabled={!canProcess}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Processar extração
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Concorrente</Label>
              <Select value={competitorId} onValueChange={setCompetitorId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingCompetitors ? "Carregando..." : "Selecione um concorrente ativo"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {competitors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de conteúdo</Label>
              <Select value={inputType} onValueChange={(v) => setInputType(v as "text" | "html")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea
              rows={10}
              placeholder="Cole aqui o texto ou HTML capturado do site do concorrente..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              O Extraction Engine identifica blocos contendo marca, modelo, ano, KM e preço. Nenhum
              acesso externo é feito.
            </p>
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Preview ({preview.totals.total}) — válidos: {preview.totals.valid} · revisar:{" "}
              {preview.totals.review} · inválidos: {preview.totals.invalid}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={isConfirming}>
                Limpar
              </Button>
              <Button onClick={handleConfirm} disabled={isConfirming || validCount === 0}>
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Confirmar importação ({validCount})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {preview.rows.length ? (
              <ExtractionPreviewTable
                rows={preview.rows}
                onChange={updateRow}
                onRemove={removeRow}
              />
            ) : (
              <EmptyState
                icon={Download}
                title="Nenhuma linha no preview"
                description="Ajuste o conteúdo colado e processe novamente."
              />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
