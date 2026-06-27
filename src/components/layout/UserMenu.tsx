import { useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function initialsOf(name: string | null, email: string | null) {
  const base = name?.trim() || email || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = user.fullName || user.email || "Usuário";
  const roleLabel = roles.includes("admin")
    ? "Administrador"
    : roles.includes("gerente")
      ? "Gerente"
      : "Sem papel";

  async function handleSignOut() {
    await signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/login", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
              {initialsOf(user.fullName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start text-left sm:flex">
            <span className="text-sm font-medium leading-tight">{displayName}</span>
            <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
          <UserIcon className="h-4 w-4" /> Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
          <Settings className="h-4 w-4" /> Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
