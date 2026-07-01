import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, profileLoading, session, isAuthorized, isInactive, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useRealtimeSync();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!session) {
      navigate({ to: "/login", search: { redirect: pathname }, replace: true });
      return;
    }

    if (isInactive) {
      toast.error("Sua conta está inativa. Fale com o administrador.");
      void signOut();
      navigate({ to: "/login", replace: true });
      return;
    }

    if (!isAuthorized) {
      // Session válida mas sem permissão (nenhum papel atribuído)
      toast.error("Seu usuário não possui permissão de acesso. Solicite ao administrador.");
      void signOut();
      navigate({ to: "/login", replace: true });
    }
  }, [loading, profileLoading, session, isAuthorized, isInactive, roles, navigate, pathname, signOut]);

  if (loading || profileLoading || !session || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
