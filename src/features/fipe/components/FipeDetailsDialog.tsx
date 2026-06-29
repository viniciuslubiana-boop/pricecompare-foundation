import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FipeStatusBadge } from "./FipeStatusBadge";
import type { FipeLinkMode } from "../types/fipe.types";

interface FipeDetailsValue {
  brand: string;
  model: string;
  year_model: number | string | null;
  price: number | null;
  fipe_code: string | null;
  fipe_value: number | null;
  fipe_status: string | null;
  fipe_reference_month: string | null;
  fipe_link_mode: FipeLinkMode | string | null;
  fipe_linked_at: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: FipeDetailsValue | null;
}

const fmtMoney = (v: number | null | undefined) =>
  typeof v !== "number"
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtPct = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const ORIGIN_LABEL: Record<string, string> = {
  auto: "Automática",
  manual: "Manual",
};

export function FipeDetailsDialog({ open, onOpenChange, vehicle }: Props) {
  if (!vehicle) return null;
  const diff =
    typeof vehicle.price === "number" && typeof vehicle.fipe_value === "number"
      ? vehicle.price - vehicle.fipe_value
      : null;
  const pct =
    diff !== null && typeof vehicle.fipe_value === "number" && vehicle.fipe_value > 0
      ? (diff / vehicle.fipe_value) * 100
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes FIPE</DialogTitle>
          <DialogDescription>
            {vehicle.brand} {vehicle.model} · {vehicle.year_model ?? "—"}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Item label="Código FIPE" value={vehicle.fipe_code ?? "—"} />
          <Item label="Valor FIPE" value={fmtMoney(vehicle.fipe_value)} />
          <Item label="Mês de referência" value={vehicle.fipe_reference_month ?? "—"} />
          <Item
            label="Origem"
            value={
              vehicle.fipe_link_mode
                ? (ORIGIN_LABEL[String(vehicle.fipe_link_mode)] ?? String(vehicle.fipe_link_mode))
                : "—"
            }
          />
          <Item label="Meu preço" value={fmtMoney(vehicle.price)} />
          <Item label="Diferença FIPE" value={`${fmtMoney(diff)} (${fmtPct(pct)})`} />
          <Item label="Vinculada em" value={fmtDate(vehicle.fipe_linked_at)} />
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <FipeStatusBadge status={vehicle.fipe_status} />
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          A FIPE é referência complementar. Não substitui a comparação com concorrentes.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
