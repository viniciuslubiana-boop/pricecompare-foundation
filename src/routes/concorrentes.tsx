import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export const Route = createFileRoute("/concorrentes")({
  head: () => ({ meta: [{ title: "Concorrentes · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Concorrentes"
        description="Cadastre e acompanhe os concorrentes que deseja monitorar."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Novo concorrente
          </Button>
        }
      />
      <EmptyState
        icon={Users}
        title="Nenhum concorrente cadastrado"
        description="Adicione concorrentes para começar a comparar preços de estoque."
        action={
          <Button>
            <Plus className="h-4 w-4" /> Adicionar concorrente
          </Button>
        }
      />
    </div>
  ),
});
