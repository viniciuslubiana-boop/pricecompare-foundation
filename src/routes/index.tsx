import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Package, Users, GitCompareArrows, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · PriceCompare" },
      { name: "description", content: "Visão geral do seu estoque e concorrentes." },
    ],
  }),
  component: DashboardPage,
});

const STATS = [
  { label: "Veículos no estoque", value: "—", icon: Package },
  { label: "Concorrentes monitorados", value: "—", icon: Users },
  { label: "Comparações realizadas", value: "—", icon: GitCompareArrows },
];

function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Acompanhe os principais indicadores do seu estoque e dos concorrentes."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Nova comparação
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{s.value}</div>
              <CardDescription className="mt-1">
                Aguardando primeiros dados
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        icon={LayoutDashboard}
        title="Seu dashboard está vazio"
        description="Cadastre seu estoque e adicione concorrentes para começar a comparar preços."
        action={
          <Button>
            <Plus className="h-4 w-4" /> Cadastrar estoque
          </Button>
        }
      />
    </div>
  );
}
