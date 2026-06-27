import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StrategyPanel } from "@/features/comparison/components/StrategyPanel";

export const Route = createFileRoute("/_authenticated/estrategia-preco")({
  head: () => ({
    meta: [
      { title: "Estratégia de Preço · PriceCompare" },
      {
        name: "description",
        content:
          "Recomendação comercial por veículo, com simulador de cenários de redução e nova posição no mercado.",
      },
    ],
  }),
  component: EstrategiaPrecoPage,
});

function EstrategiaPrecoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estratégia de Preço"
        description="Para cada veículo: posição atual, cenários simulados, recomendação e impacto esperado. Cálculos centralizados no Comparison Engine."
      />
      <StrategyPanel />
    </div>
  );
}
