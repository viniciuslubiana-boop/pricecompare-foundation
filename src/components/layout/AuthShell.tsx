import type { ReactNode } from "react";
import { Gauge } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Gauge className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">PriceCompare</span>
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Inteligência de mercado para revendas e concessionárias.
          </h2>
          <p className="text-sm text-sidebar-foreground/70">
            Compare seu estoque com o de concorrentes em tempo real e tome
            decisões de preço com mais segurança.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} PriceCompare
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Gauge className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold">PriceCompare</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
