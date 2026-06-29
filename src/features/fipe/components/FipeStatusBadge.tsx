import { Badge } from "@/components/ui/badge";
import type { FipeStatus } from "../types/fipe.types";

const LABEL: Record<FipeStatus, string> = {
  nao_verificada: "Não verificada",
  encontrada: "FIPE encontrada",
  nao_encontrada: "FIPE não encontrada",
  vinculada_manualmente: "Vinculada manualmente",
  desatualizada: "FIPE desatualizada",
};

const VARIANT: Record<FipeStatus, "default" | "secondary" | "destructive" | "outline"> = {
  nao_verificada: "outline",
  encontrada: "default",
  nao_encontrada: "destructive",
  vinculada_manualmente: "secondary",
  desatualizada: "secondary",
};

export function FipeStatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "nao_verificada") as FipeStatus;
  return <Badge variant={VARIANT[s] ?? "outline"}>{LABEL[s] ?? LABEL.nao_verificada}</Badge>;
}
