import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ChevronDown, ChevronRight } from "lucide-react";

type ErrorEntry = {
  stage?: string;
  message?: string;
  markdown_sample?: string;
  sample?: string;
  ai_json_sample?: string;
  json_sample?: string;
  signals?: Record<string, unknown>;
  hypotheses?: string[];
  [k: string]: unknown;
};

type ExtractionLogRow = {
  id: string;
  competitor_id: string;
  url: string;
  status: string;
  vehicles_found: number;
  pages_processed: number;
  finished_at: string | null;
  created_at: string;
  error_log: unknown;
};

type CompetitorRow = { id: string; name: string };

type StageFilter = "all" | "validation" | "ai" | "fatal" | "firecrawl" | "insert";

const STAGE_OPTIONS: { value: StageFilter; label: string }[] = [
  { value: "all", label: "Todos os stages" },
  { value: "validation", label: "validation" },
  { value: "ai", label: "ai" },
  { value: "fatal", label: "fatal" },
  { value: "firecrawl", label: "firecrawl" },
  { value: "insert", label: "insert" },
];

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed") return "default";
  if (s === "partial") return "secondary";
  if (s === "failed") return "destructive";
  return "outline";
}

function parseErrors(raw: unknown): ErrorEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ErrorEntry[];
  if (typeof raw === "object") return [raw as ErrorEntry];
  return [];
}

function lastError(raw: unknown): ErrorEntry | null {
  const arr = parseErrors(raw);
  return arr.length ? arr[arr.length - 1] : null;
}

function formatLast(raw: unknown): string {
  const last = lastError(raw);
  if (!last) return "—";
  return `${last.stage ?? "?"}: ${last.message ?? ""}`.slice(0, 140);
}

function DiagnosticoExtracaoPage() {
  const [stage, setStage] = useState<StageFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["extraction-logs", "diagnostico"],
    queryFn: async () => {
      const [{ data: logs, error: e1 }, { data: comps, error: e2 }] = await Promise.all([
        supabase
          .from("extraction_logs")
          .select(
            "id, competitor_id, url, status, vehicles_found, pages_processed, finished_at, created_at, error_log",
          )
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("competitors").select("id, name"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const nameById = new Map(
        ((comps as CompetitorRow[] | null) ?? []).map((c) => [c.id, c.name]),
      );
      return ((logs as ExtractionLogRow[] | null) ?? []).map((l) => ({
        ...l,
        competitor_name: nameById.get(l.competitor_id) ?? "—",
      }));
    },
    refetchInterval: 5000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((l) => {
      if (q && !l.url.toLowerCase().includes(q) && !l.competitor_name.toLowerCase().includes(q)) {
        return false;
      }
      if (stage !== "all") {
        const stages = parseErrors(l.error_log).map((e) => e.stage);
        if (!stages.includes(stage)) return false;
      }
      return true;
    });
  }, [data, search, stage]);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico de Extração"
        description="Últimas 100 execuções por concorrente. Atualiza a cada 5s."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por URL ou concorrente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select value={stage} onValueChange={(v) => setStage(v as StageFilter)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || stage !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStage("all");
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum log encontrado"
          description="Ajuste os filtros ou rode 'Atualizar Mercado' para gerar logs."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left">
              <tr>
                <th className="p-3 w-8" />
                <th className="p-3">Quando</th>
                <th className="p-3">Concorrente</th>
                <th className="p-3">URL</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Veículos</th>
                <th className="p-3 text-right">Páginas</th>
                <th className="p-3">Último erro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const isOpen = !!expanded[l.id];
                const errors = parseErrors(l.error_log);
                return (
                  <>
                    <tr
                      key={l.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggle(l.id)}
                    >
                      <td className="p-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3">{l.competitor_name}</td>
                      <td className="p-3 max-w-[280px] truncate">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.url}
                        </a>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                      </td>
                      <td className="p-3 text-right">{l.vehicles_found}</td>
                      <td className="p-3 text-right">{l.pages_processed}</td>
                      <td className="p-3 text-muted-foreground max-w-[320px] truncate">
                        {formatLast(l.error_log)}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${l.id}-d`} className="border-b last:border-0 bg-muted/10">
                        <td />
                        <td colSpan={7} className="p-4 space-y-4">
                          {errors.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Nenhum detalhe registrado para esta execução.
                            </p>
                          ) : (
                            errors.map((err, i) => {
                              const markdown = err.markdown_sample ?? err.sample;
                              const json = err.ai_json_sample ?? err.json_sample;
                              return (
                                <div
                                  key={i}
                                  className="rounded-md border bg-background p-3 space-y-3"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{err.stage ?? "?"}</Badge>
                                    {err.message && (
                                      <span className="text-sm">{err.message}</span>
                                    )}
                                  </div>
                                  {err.signals && (
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                                        Sinais
                                      </div>
                                      <pre className="text-xs bg-muted/40 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(err.signals, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {Array.isArray(err.hypotheses) && err.hypotheses.length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                                        Hipóteses
                                      </div>
                                      <ul className="list-disc pl-5 text-xs space-y-0.5">
                                        {err.hypotheses.map((h, j) => (
                                          <li key={j}>{h}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {markdown && (
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                                        Amostra do Markdown
                                      </div>
                                      <pre className="text-xs bg-muted/40 p-2 rounded max-h-72 overflow-auto whitespace-pre-wrap">
                                        {markdown}
                                      </pre>
                                    </div>
                                  )}
                                  {json && (
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                                        Amostra do JSON da IA
                                      </div>
                                      <pre className="text-xs bg-muted/40 p-2 rounded max-h-72 overflow-auto">
                                        {json}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/diagnostico-extracao")({
  component: DiagnosticoExtracaoPage,
});
