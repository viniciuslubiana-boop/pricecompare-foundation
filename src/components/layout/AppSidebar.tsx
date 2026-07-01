import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NAV_ITEMS, isNavGroup, type NavGroup } from "@/lib/nav";
import { ChevronRight, Gauge } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();
  const entries = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const isGroupActive = (group: NavGroup) => group.items.some((i) => isActive(i.url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Gauge className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">PriceCompare</span>
            <span className="text-[10px] text-sidebar-foreground/60">Inteligência de preços</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {entries.map((entry) => {
                if (isNavGroup(entry)) {
                  const groupActive = isGroupActive(entry);
                  return (
                    <Collapsible
                      key={entry.title}
                      defaultOpen={groupActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={entry.title} isActive={groupActive}>
                            <entry.icon />
                            <span>{entry.title}</span>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {entry.items.map((sub) => (
                              <SidebarMenuSubItem key={sub.url}>
                                <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                                  <Link to={sub.url}>
                                    <sub.icon />
                                    <span>{sub.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={entry.url}>
                    <SidebarMenuButton asChild isActive={isActive(entry.url)} tooltip={entry.title}>
                      <Link to={entry.url}>
                        <entry.icon />
                        <span>{entry.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1.5 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          v0.1.0 · Sprint Zero
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
