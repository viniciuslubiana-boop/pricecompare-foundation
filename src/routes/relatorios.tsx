import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { FileBarChart, Plus } from "lucide-react";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Relatórios"
        description="Gere e exporte relatórios de comparação e desempenho."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Novo relatório
          </Button>
        }
      />
      <EmptyState
        icon={FileBarChart}
        title="Nenhum relatório gerado"
        description="Crie um relatório a partir das suas comparações para visualizar aqui."
        action={
          <Button>
            <Plus className="h-4 w-4" /> Gerar relatório
          </Button>
        }
      />
    </div>
  ),
});
