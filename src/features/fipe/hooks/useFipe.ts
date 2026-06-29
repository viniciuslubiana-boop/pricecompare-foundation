import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { fipeManualLink, fipeQuote, fipeUpdateRun } from "@/lib/fipe.functions";

/** Roda "Atualizar FIPE" para uma Empresa Base. */
export function useFipeUpdateRun() {
  const qc = useQueryClient();
  const runFn = useServerFn(fipeUpdateRun);
  return useMutation({
    mutationFn: (baseCompanyId: string) => runFn({ data: { base_company_id: baseCompanyId } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("FIPE atualizada", {
        description: `${res.matched} encontradas / ${res.unmatched} não encontradas / ${res.errors} erros (${res.total_vehicles} veículos).`,
      });
    },
    onError: (e: Error) => toast.error("Falha ao atualizar FIPE", { description: e.message }),
  });
}

/** Cotação avulsa (preview no diálogo manual). */
export function useFipeQuote() {
  const quoteFn = useServerFn(fipeQuote);
  return useMutation({
    mutationFn: (input: { brand: string; model: string; year_model: number; fuel?: string | null }) =>
      quoteFn({ data: input }),
  });
}

/** Vincular FIPE manualmente por código. */
export function useFipeManualLink() {
  const qc = useQueryClient();
  const linkFn = useServerFn(fipeManualLink);
  return useMutation({
    mutationFn: (input: {
      vehicle_id: string;
      brand: string;
      model: string;
      year_model: number;
      fuel?: string | null;
      fipe_code: string;
    }) => linkFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("FIPE vinculada manualmente");
    },
    onError: (e: Error) =>
      toast.error("Não foi possível vincular FIPE", { description: e.message }),
  });
}
