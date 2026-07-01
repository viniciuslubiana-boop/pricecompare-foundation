import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { AuthShell } from "@/components/layout/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha · PriceCompare" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperação de senha"
      subtitle="PriceCompare — Inteligência de mercado para revendas e concessionárias."
    >
      <div className="space-y-4">
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Por segurança, a redefinição de senha é feita exclusivamente pelo{" "}
            <strong>administrador da conta</strong>. Solicite ao responsável da sua organização o
            envio de um novo link de acesso.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4" /> Voltar para o login
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
