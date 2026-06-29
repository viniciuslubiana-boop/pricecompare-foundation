import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2 } from "lucide-react";
import { useFipeUpdateRun } from "../hooks/useFipe";

interface Props {
  baseCompanyId: string | null;
  disabled?: boolean;
}

/** Botão "Atualizar FIPE" — só atualiza a Empresa Base selecionada. */
export function FipeUpdateButton({ baseCompanyId, disabled }: Props) {
  const mut = useFipeUpdateRun();
  const onClick = () => {
    if (!baseCompanyId) return;
    mut.mutate(baseCompanyId);
  };
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={!baseCompanyId || disabled || mut.isPending}
    >
      {mut.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}
      Atualizar FIPE
    </Button>
  );
}
