import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { locatorService, type CompetitorSourceUrls } from "../services/locator.service";
import type { Competitor } from "@/types/database.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: Competitor | null;
  onSaved?: (c: Competitor) => void;
}

export function SourcesDialog({ open, onOpenChange, competitor, onSaved }: Props) {
  const [values, setValues] = useState<CompetitorSourceUrls>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && competitor) {
      setValues((competitor.source_urls ?? {}) as CompetitorSourceUrls);
    }
  }, [open, competitor]);


  const set = (k: keyof CompetitorSourceUrls) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const handleSave = async () => {
    if (!competitor) return;
    setSaving(true);
    try {
      const saved = await locatorService.updateSources(competitor.id, values);
      toast.success("Fontes de estoque atualizadas");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.error("Erro ao salvar fontes", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar fontes de estoque</DialogTitle>
          <DialogDescription>
            Informe as URLs públicas onde o concorrente publica os veículos.
            O site próprio será usado como URL principal para extração.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Site próprio</Label>
            <Input placeholder="https://..." value={values.ownSite ?? ""} onChange={set("ownSite")} />
          </div>
          <div className="space-y-1">
            <Label>OLX</Label>
            <Input placeholder="https://www.olx.com.br/..." value={values.olx ?? ""} onChange={set("olx")} />
          </div>
          <div className="space-y-1">
            <Label>Webmotors</Label>
            <Input placeholder="https://www.webmotors.com.br/..." value={values.webmotors ?? ""} onChange={set("webmotors")} />
          </div>
          <div className="space-y-1">
            <Label>Mobiauto</Label>
            <Input placeholder="https://www.mobiauto.com.br/..." value={values.mobiauto ?? ""} onChange={set("mobiauto")} />
          </div>
          <div className="space-y-1">
            <Label>iCarros</Label>
            <Input placeholder="https://www.icarros.com.br/..." value={values.icarros ?? ""} onChange={set("icarros")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar fontes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
