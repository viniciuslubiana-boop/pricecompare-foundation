import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  inventoryVehicleSchema,
  type InventoryFormInput,
  type InventoryFormValues,
} from "../schemas/inventory.schema";
import type { Vehicle } from "../types/inventory.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSubmit: (values: InventoryFormValues) => Promise<unknown> | void;
  submitting?: boolean;
}

const empty: InventoryFormInput = {
  brand: "",
  model: "",
  year_model: "",
  km: "",
  price: "",
  supplier_name: "",
};

export function VehicleFormDialog({ open, onOpenChange, vehicle, onSubmit, submitting }: Props) {
  const form = useForm<InventoryFormInput, unknown, InventoryFormValues>({
    resolver: zodResolver(inventoryVehicleSchema),
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        vehicle
          ? {
              brand: vehicle.brand,
              model: vehicle.model,
              year_model: vehicle.year_model,
              km: String(vehicle.km ?? ""),
              price: String(vehicle.price ?? ""),
              supplier_name: vehicle.supplier_name ?? "",
            }
          : empty,
      );
    }
  }, [open, vehicle, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar veículo" : "Adicionar veículo"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do veículo. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Corolla XEi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano/Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 2022/2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="Ex.: 45.000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="Ex.: 89.900,00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {vehicle ? "Salvar alterações" : "Cadastrar veículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
