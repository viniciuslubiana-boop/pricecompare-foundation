import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Download, Play } from "lucide-react";

export const Route = createFileRoute("/extrair-concorrente")({
  head: () => ({ meta: [{ title: "Extrair Concorrente · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Extrair Concorrente"
        description="Execute uma nova extração de estoque de um concorrente cadastrado."
        actions={
          <Button>
            <Play className="h-4 w-4" /> Nova extração
          </Button>
        }
      />
      <EmptyState
        icon={Download}
        title="Nenhuma extração executada"
        description="As extrações realizadas aparecerão aqui com status e histórico."
        action={
          <Button>
            <Play className="h-4 w-4" /> Iniciar extração
          </Button>
        }
      />
    </div>
  ),
});
