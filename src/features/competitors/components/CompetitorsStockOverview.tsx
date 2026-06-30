import { Building2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitorStockSection } from "./CompetitorStockSection";
import type { Competitor } from "@/features/competitors/types/competitor.types";

interface Props {
  competitors: Competitor[];
}

export function CompetitorsStockOverview({ competitors }: Props) {
  if (!competitors.length) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Estoque por concorrente</CardTitle>
        <CardDescription>
          Visualize o estoque sincronizado de cada loja. Clique para expandir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {competitors.map((c) => (
            <AccordionItem key={c.id} value={c.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-2 text-left">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{c.name}</span>
                  {c.url ? (
                    <span className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {c.url}
                    </span>
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CompetitorStockSection competitorId={c.id} competitorName={c.name} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
