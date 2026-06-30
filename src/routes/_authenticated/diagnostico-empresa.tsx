import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Stethoscope, Loader2 } from "lucide-react";
import {
  useDiscoverSite,
  useSiteDiscoveries,
} from "@/features/site-discovery";
import type { AcquisitionCompanyType } from "@/features/market-acquisition";

export const Route = createFileRoute("/_authenticated/diagnostico-empresa")({
  component: DiagnosticoEmpresaPage,
});

function statusFromConfidence(confidence: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (confidence >= 80) return { label: "Alta confiança", variant: "default" };
  if (confidence >= 50) return { label: "Média confiança", variant: "secondary" };
  if (confidence > 0) return { label: "Baixa confiança", variant: "outline" };
  return { label: "Não identificada", variant: "destructive" };
}

function DiagnosticoEmpresaPage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [companyType, setCompanyType] =
    useState<AcquisitionCompanyType>("competitor");

  const discover = useDiscoverSite();
  const { data: rows = [], isLoading } = useSiteDiscoveries();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    discover.mutate({ companyType, url: url.trim() });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico da Empresa"
        description="Descoberta automática da tecnologia utilizada pelo site."
      />

      <Card>
        <CardHeader>
          <CardTitle>Detectar tecnologia</CardTitle>
          <CardDescription>
            Informe nome e URL — o PCM identifica a plataforma automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-4 md:items-end"
          >
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="name">Empresa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da empresa"
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
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={companyType}
                onValueChange={(v) =>
                  setCompanyType(v as AcquisitionCompanyType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base_company">Empresa Base</SelectItem>
                  <SelectItem value="competitor">Concorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={discover.isPending}>
                {discover.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analisando…
                  </>
                ) : (
                  "Detectar"
                )}
              </Button>
              {discover.data && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <Badge>{discover.data.technology}</Badge>
                  <span className="text-muted-foreground">
                    {discover.data.confidence.toFixed(0)}% • {discover.data.discoveryTimeMs} ms
                  </span>
                  {name && (
                    <span className="text-muted-foreground">• {name}</span>
                  )}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descobertas recentes</CardTitle>
          <CardDescription>
            Histórico em <code>site_discovery</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tecnologia</TableHead>
                <TableHead className="text-right">Confiança</TableHead>
                <TableHead>Última descoberta</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={Stethoscope}
                      title="Sem descobertas ainda"
                      description="Detecte a tecnologia de uma empresa para começar."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const conf = Number(r.confidence);
                  const status = statusFromConfidence(conf);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[260px] truncate">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {r.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        {r.company_type === "base_company"
                          ? "Empresa Base"
                          : "Concorrente"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.technology}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{conf.toFixed(0)}%</TableCell>
                      <TableCell>
                        {new Date(r.detected_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.discovery_time_ms ?? "—"} ms
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
