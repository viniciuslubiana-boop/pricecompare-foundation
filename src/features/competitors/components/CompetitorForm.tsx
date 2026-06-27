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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  competitorSchema,
  type CompetitorFormInput,
  type CompetitorFormValues,
} from "../schemas/competitor.schema";
import type { Competitor } from "../types/competitor.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor?: Competitor | null;
  onSubmit: (values: CompetitorFormValues) => Promise<unknown> | void;
  submitting?: boolean;
}

const empty: CompetitorFormInput = {
  name: "",
  url: "",
  notes: "",
  status: "active",
};

export function CompetitorForm({ open, onOpenChange, competitor, onSubmit, submitting }: Props) {
  const form = useForm<CompetitorFormInput>({
    resolver: zodResolver(competitorSchema) as never,
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        competitor
          ? {
              name: competitor.name,
              url: competitor.url ?? "",
              notes: competitor.notes ?? "",
              status: (competitor.status as "active" | "inactive") ?? "active",
            }
          : empty,
      );
    }
  }, [open, competitor, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values as unknown as CompetitorFormValues);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{competitor ? "Editar concorrente" : "Cadastrar concorrente"}</DialogTitle>
          <DialogDescription>
            Informe o nome e a URL do site que deseja monitorar. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Loja XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.exemplo.com.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Opcional"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {competitor ? "Salvar alterações" : "Cadastrar concorrente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
