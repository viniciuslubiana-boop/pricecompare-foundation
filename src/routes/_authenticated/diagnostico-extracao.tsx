import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";

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

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed") return "default";
  if (s === "partial") return "secondary";
  if (s === "failed") return "destructive";
  return "outline";
}

function formatErrors(raw: unknown): string {
  if (!raw) return "—";
  try {
    const arr = Array.isArray(raw) ? raw : [raw];
    const last = arr[arr.length - 1] as { stage?: string; message?: string } | undefined;
    if (!last) return "—";
    return `${last.stage ?? "?"}: ${last.message ?? ""}`.slice(0, 140);
  } catch {
    return "—";
  }
}

function DiagnosticoExtracaoPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["extraction-logs", "diagnostico"],
    queryFn: async () => {
      const [{ data: logs, error: e1 }, { data: comps, error: e2 }] = await Promise.all([
        supabase
          .from("extraction_logs")
          .select("id, competitor_id, url, status, vehicles_found, pages_processed, finished_at, created_at, error_log")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("competitors").select("id, name"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const nameById = new Map((comps as CompetitorRow[] | null ?? []).map((c) => [c.id, c.name]));
      return (logs as ExtractionLogRow[] | null ?? []).map((l) => ({
        ...l,
        competitor_name: nameById.get(l.competitor_id) ?? "—",
      }));
    },
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico de Extração"
        description="Últimas 50 execuções de extração por concorrente. Atualiza a cada 5s."
      />
      {isLoading ? (
        <LoadingSkeleton />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Sem execuções ainda" description="Rode 'Atualizar Mercado' para gerar logs." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left">
              <tr>
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
              {data.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">{l.competitor_name}</td>
                  <td className="p-3 max-w-[280px] truncate">
                    <a href={l.url} target="_blank" rel="noreferrer" className="underline">
                      {l.url}
                    </a>
                  </td>
                  <td className="p-3">
                    <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                  </td>
                  <td className="p-3 text-right">{l.vehicles_found}</td>
                  <td className="p-3 text-right">{l.pages_processed}</td>
                  <td className="p-3 text-muted-foreground max-w-[320px] truncate">
                    {formatErrors(l.error_log)}
                  </td>
                </tr>
              ))}
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
