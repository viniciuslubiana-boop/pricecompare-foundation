import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { GitCompareArrows, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comparar")({
  head: () => ({ meta: [{ title: "Comparar · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Comparar"
        description="Compare o seu estoque com o de um ou mais concorrentes."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Nova comparação
          </Button>
        }
      />
      <EmptyState
        icon={GitCompareArrows}
        title="Nenhuma comparação disponível"
        description="Selecione um concorrente e seu estoque para gerar a primeira comparação."
        action={
          <Button>
            <Plus className="h-4 w-4" /> Criar comparação
          </Button>
        }
      />
    </div>
  ),
});
