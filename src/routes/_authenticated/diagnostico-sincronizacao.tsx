import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Activity } from "lucide-react";
import { AcquisitionMethod } from "@/features/market-acquisition";

export const Route = createFileRoute(
  "/_authenticated/diagnostico-sincronizacao",
)({
  component: DiagnosticoSincronizacaoPage,
});

function DiagnosticoSincronizacaoPage() {
  const methods = Object.values(AcquisitionMethod);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico de Sincronização"
        description="Monitoramento das execuções do Market Acquisition Engine (MAE)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Métodos de Aquisição Suportados</CardTitle>
          <CardDescription>
            Estrutura oficial do MAE. Providers concretos serão registrados nas
            próximas sprints.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <Badge key={method} variant="secondary">
              {method}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execuções Recentes</CardTitle>
          <CardDescription>
            Logs registrados em <code>market_acquisition_logs</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead className="text-right">Encontrados</TableHead>
                <TableHead className="text-right">Salvos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Activity}
                    title="Sem execuções ainda"
                    description="Assim que o MAE começar a operar, as execuções aparecerão aqui."
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
