import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { cn } from "@/lib/utils";
import type { ExtractedVehicle } from "../types/extraction.types";
import { averageConfidence } from "../validators/extraction.validator";

interface Props {
  rows: ExtractedVehicle[];
  onChange: (tempId: string, patch: Partial<ExtractedVehicle>) => void;
  onRemove: (tempId: string) => void;
}

const STATUS_LABEL: Record<ExtractedVehicle["status"], string> = {
  valid: "Válido",
  review: "Revisar",
  invalid: "Inválido",
};

const STATUS_TONE: Record<ExtractedVehicle["status"], string> = {
  valid: "bg-success/15 text-success border-success/30",
  review: "bg-warning/15 text-warning-foreground border-warning/40",
  invalid: "bg-destructive/15 text-destructive border-destructive/30",
};

export function ExtractionPreviewTable({ rows, onChange, onRemove }: Props) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Marca</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead className="w-[110px]">Ano/Modelo</TableHead>
            <TableHead className="w-[110px]">KM</TableHead>
            <TableHead className="w-[140px]">Valor (R$)</TableHead>
            <TableHead className="w-[130px]">Confiança</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[60px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.tempId}>
              <TableCell>
                <Input
                  value={r.brand}
                  onChange={(e) => onChange(r.tempId, { brand: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={r.model}
                  onChange={(e) => onChange(r.tempId, { model: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={r.year_model}
                  onChange={(e) => onChange(r.tempId, { year_model: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={r.km ?? ""}
                  onChange={(e) =>
                    onChange(r.tempId, {
                      km: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={r.price ?? ""}
                  onChange={(e) =>
                    onChange(r.tempId, {
                      price: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <ConfidenceBadge value={averageConfidence(r)} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("font-medium", STATUS_TONE[r.status])}
                  title={r.errors.join(" • ")}
                >
                  {STATUS_LABEL[r.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(r.tempId)}
                  aria-label="Remover linha"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
