import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Largura do drawer. Padrão: muito largo para tabelas. */
  widthClass?: string;
}

/**
 * Drawer lateral padrão para drill-downs do Dashboard Executivo.
 * Não executa cálculos — apenas exibe dados já produzidos pelos Engines.
 */
export function DrillDownDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  widthClass = "w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl",
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`${widthClass} overflow-y-auto`}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
