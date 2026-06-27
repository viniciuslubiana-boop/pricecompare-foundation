import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Settings, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Configurações"
        description="Ajuste preferências da conta, integrações e equipe."
        actions={
          <Button variant="outline">
            <Pencil className="h-4 w-4" /> Editar perfil
          </Button>
        }
      />
      <EmptyState
        icon={Settings}
        title="Configurações em breve"
        description="As opções de personalização aparecerão aqui nas próximas etapas."
      />
    </div>
  ),
});
