import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserPlus } from "lucide-react";

export const Route = createFileRoute("/administracao")({
  head: () => ({ meta: [{ title: "Administração · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Administração"
        description="Gerencie usuários, permissões e configurações da organização."
        actions={
          <Button>
            <UserPlus className="h-4 w-4" /> Convidar usuário
          </Button>
        }
      />
      <EmptyState
        icon={ShieldCheck}
        title="Painel administrativo"
        description="As ferramentas administrativas serão liberadas nas próximas etapas."
      />
    </div>
  ),
});
