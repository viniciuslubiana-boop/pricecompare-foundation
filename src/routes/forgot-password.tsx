import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";

import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha · PriceCompare" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("O e-mail é obrigatório.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Não foi possível enviar o e-mail de recuperação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="PriceCompare — Inteligência de mercado para revendas e concessionárias."
    >
      {sent ? (
        <div className="space-y-4">
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertDescription>
              Enviamos um link de recuperação para <strong>{email}</strong>.
              Verifique sua caixa de entrada.
            </AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">
              <ArrowLeft className="h-4 w-4" /> Voltar para o login
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail da conta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar link de recuperação
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">
              <ArrowLeft className="h-4 w-4" /> Voltar para o login
            </Link>
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
