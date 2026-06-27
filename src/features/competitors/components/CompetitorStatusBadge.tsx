import { StatusBadge } from "@/components/StatusBadge";
import type { CompetitorStatus } from "../types/competitor.types";

export function CompetitorStatusBadge({ status }: { status: CompetitorStatus }) {
  return <StatusBadge status={status === "active" ? "ativo" : "inativo"} />;
}
