import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCoverageReport } from "../hooks";

export function CoverageReportSection() {
  const { data, isLoading } = useCoverageReport();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cobertura canônica</CardTitle>
        <CardDescription>
          Percentual do Meu Estoque resolvido pelo Catálogo Mestre (modelo canônico ou alias vinculado).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resolvidos</span>
                <span className="font-medium">
                  {data.resolvedVehicles} / {data.totalVehicles}
                </span>
              </div>
              <Progress
                value={data.totalVehicles ? (data.resolvedVehicles / data.totalVehicles) * 100 : 0}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Tile label="Veículos no estoque" value={data.totalVehicles} />
              <Tile label="Sem modelo canônico" value={data.unresolvedVehicles} />
              <Tile label="Aliases cadastrados" value={data.totalAliases} />
              <Tile label="Aliases órfãos" value={data.orphanAliases} />
              <Tile label="Modelos duplicados" value={data.duplicatedModels} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
