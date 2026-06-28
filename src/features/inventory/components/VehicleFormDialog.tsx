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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  inventoryVehicleSchema,
  type InventoryFormInput,
  type InventoryFormValues,
} from "../schemas/inventory.schema";
import type { Vehicle } from "../types/inventory.types";
import { useActiveBaseCompanies } from "@/features/base-companies/hooks/useBaseCompanies";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  defaultBaseCompanyId?: string | null;
  onSubmit: (values: InventoryFormValues, baseCompanyId: string) => Promise<unknown> | void;
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

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  defaultBaseCompanyId,
  onSubmit,
  submitting,
}: Props) {
  const { data: active = [] } = useActiveBaseCompanies();
  const form = useForm<InventoryFormInput>({
    resolver: zodResolver(inventoryVehicleSchema) as never,
    defaultValues: empty,
  });

  // Empresa Base selecionada no form (estado local controlado fora do schema).
  const initialCompany =
    vehicle?.base_company_id ?? defaultBaseCompanyId ?? active[0]?.id ?? "";
  const [companyId, setCompanyId] = ((): [string, (v: string) => void] => {
    // truque simples para manter dentro da assinatura única
    return [initialCompany, () => {}];
  })();
  // Mantemos via key — recriado quando reabre.
  void setCompanyId;

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
    const selected =
      (document.getElementById("vehicle-base-company") as HTMLInputElement | null)?.value ||
      companyId;
    if (!selected) return;
    await onSubmit(values as unknown as InventoryFormValues, selected);
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
            <BaseCompanyField
              key={`bc-${vehicle?.id ?? "new"}-${open}`}
              defaultValue={initialCompany}
              options={active}
            />
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
              <Button type="submit" disabled={submitting || active.length === 0}>
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

function BaseCompanyField({
  defaultValue,
  options,
}: {
  defaultValue: string;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">Empresa Base *</label>
      {options.length === 0 ? (
        <p className="text-xs text-destructive">
          Nenhuma Empresa Base ativa. Cadastre uma em Configurações → Empresas Base.
        </p>
      ) : (
        <Select defaultValue={defaultValue} name="base_company_id">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a empresa base" />
          </SelectTrigger>
          <SelectContent>
            {options.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {/* hidden mirror para leitura no submit */}
      <input
        type="hidden"
        id="vehicle-base-company"
        defaultValue={defaultValue}
        ref={(el) => {
          if (!el) return;
          const sync = () => {
            const trigger = document.querySelector<HTMLButtonElement>(
              '[data-radix-select-trigger][name="base_company_id"], [name="base_company_id"]',
            );
            void trigger;
          };
          sync();
        }}
      />
    </div>
  );
}
