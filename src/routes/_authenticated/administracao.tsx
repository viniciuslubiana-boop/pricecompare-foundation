import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, UserPlus, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";

import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/features/admin/hooks/useUsers";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { InviteUserDialog } from "@/features/admin/components/InviteUserDialog";

export const Route = createFileRoute("/_authenticated/administracao")({
  head: () => ({ meta: [{ title: "Administração · PriceCompare" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useUsers();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/", replace: true });
  }, [loading, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Administração"
        description="Gerencie usuários, perfis e acessos da organização."
        actions={
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Convidar usuário
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" /> Usuários
          </CardTitle>
          <CardDescription>
            Administradores podem convidar novos usuários, alterar perfis e inativar acessos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nenhum usuário"
              description="Convide o primeiro usuário para começar."
            />
          ) : (
            <UsersTable users={data} currentUserId={user?.id ?? ""} />
          )}
        </CardContent>
      </Card>

      <InviteUserDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
