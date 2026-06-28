import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { BaseCompany } from "../types";

const schema = z.object({
  name: z.string().min(1, "Informe o nome").max(120),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
  logo_url: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["carros", "motos", "geral"]),
  status: z.enum(["active", "inactive"]),
});

export type BaseCompanyFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: BaseCompany | null;
  submitting?: boolean;
  onSubmit: (values: BaseCompanyFormValues) => Promise<unknown> | void;
}

const empty: BaseCompanyFormValues = {
  name: "",
  city: "",
  state: "",
  website: "",
  logo_url: "",
  type: "geral",
  status: "active",
};

export function BaseCompanyForm({ open, onOpenChange, company, submitting, onSubmit }: Props) {
  const form = useForm<BaseCompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        company
          ? {
              name: company.name,
              city: company.city ?? "",
              state: company.state ?? "",
              website: company.website ?? "",
              logo_url: company.logo_url ?? "",
              type: (company.type as "carros" | "motos" | "geral") ?? "geral",
              status: (company.status as "active" | "inactive") ?? "active",
            }
          : empty,
      );
    }
  }, [open, company, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{company ? "Editar Empresa Base" : "Nova Empresa Base"}</DialogTitle>
          <DialogDescription>
            Cadastre uma das suas lojas próprias. O sistema permite no máximo duas Empresas Base
            ativas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome da empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Uninova Veículos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input maxLength={2} placeholder="UF" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Site</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Logotipo (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="carros">Carros</SelectItem>
                        <SelectItem value="motos">Motos</SelectItem>
                        <SelectItem value="geral">Geral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
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
                {company ? "Salvar alterações" : "Cadastrar empresa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
