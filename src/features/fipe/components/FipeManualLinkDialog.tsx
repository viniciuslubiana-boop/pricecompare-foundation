import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFipeManualLink } from "../hooks/useFipe";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year_model: number;
  } | null;
}

export function FipeManualLinkDialog({ open, onOpenChange, vehicle }: Props) {
  const [code, setCode] = useState("");
  const [fuel, setFuel] = useState("");
  const link = useFipeManualLink();

  const submit = async () => {
    if (!vehicle || !code.trim()) return;
    await link.mutateAsync({
      vehicle_id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year_model: vehicle.year_model,
      fuel: fuel.trim() || null,
      fipe_code: code.trim(),
    });
    setCode("");
    setFuel("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular FIPE manualmente</DialogTitle>
          <DialogDescription>
            {vehicle
              ? `${vehicle.brand} ${vehicle.model} (${vehicle.year_model}). Informe o código FIPE oficial.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="fipe_code">Código FIPE</Label>
            <Input
              id="fipe_code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ex.: 005340-6"
            />
          </div>
          <div>
            <Label htmlFor="fipe_fuel">Combustível (opcional)</Label>
            <Input
              id="fipe_fuel"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              placeholder="ex.: Flex, Gasolina, Diesel"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!code.trim() || link.isPending}>
            {link.isPending ? "Vinculando..." : "Confirmar vínculo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
