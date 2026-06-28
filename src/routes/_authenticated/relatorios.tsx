import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { FileBarChart, Plus } from "lucide-react";
import { useReferenceStore } from "@/features/settings/hooks/useReferenceStore";

function RelatoriosPage() {
  const { data: ref } = useReferenceStore();
  const refName = ref?.active && ref.name ? ref.name : "Loja de Referência";
  return (
    <div>
      <PageHeader
        title={`Comparativo de Mercado — ${refName}`}
        description="Relatórios baseados sempre na Loja de Referência. Minha Loja → Mercado."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Novo relatório
          </Button>
        }
      />
      <EmptyState
        icon={FileBarChart}
        title="Nenhum relatório gerado"
        description={`Crie um relatório comparando ${refName} ao mercado para visualizar aqui.`}
        action={
          <Button>
            <Plus className="h-4 w-4" /> Gerar relatório
          </Button>
        }
      />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · PriceCompare" }] }),
  component: RelatoriosPage,
});
