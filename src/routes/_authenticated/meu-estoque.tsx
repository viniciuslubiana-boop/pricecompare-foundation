import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meu-estoque")({
  head: () => ({ meta: [{ title: "Meu Estoque · PriceCompare" }] }),
  component: () => (
    <div>
      <PageHeader
        title="Meu Estoque"
        description="Gerencie os veículos disponíveis na sua concessionária."
        actions={
          <Button>
            <Upload className="h-4 w-4" /> Importar estoque
          </Button>
        }
      />
      <EmptyState
        icon={Package}
        title="Nenhum veículo cadastrado"
        description="Importe seu estoque por planilha ou cadastre manualmente para iniciar."
        action={
          <Button>
            <Upload className="h-4 w-4" /> Importar agora
          </Button>
        }
      />
    </div>
  ),
});
