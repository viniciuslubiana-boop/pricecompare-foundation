import { type ReactNode } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  title: string;
  description?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardBlock({
  id,
  title,
  description,
  collapsed = false,
  onToggleCollapsed,
  favorite = false,
  onToggleFavorite,
  actions,
  children,
}: Props) {
  return (
    <section id={`block-${id}`} className="mt-6 first:mt-0">
      <header className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center gap-2 text-left"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </button>
        <div className="flex items-center gap-2">
          {actions}
          {onToggleFavorite ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              aria-label={favorite ? "Remover dos favoritos" : "Marcar como favorito"}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </Button>
          ) : null}
        </div>
      </header>
      {!collapsed ? <div>{children}</div> : null}
    </section>
  );
}
