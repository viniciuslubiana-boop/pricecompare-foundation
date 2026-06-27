import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <div className="flex-1" />
      <Button variant="ghost" size="icon" aria-label="Notificações">
        <Bell className="h-4 w-4" />
      </Button>
      <ThemeToggle />
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
          PC
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
