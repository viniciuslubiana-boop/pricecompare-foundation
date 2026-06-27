import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gerente";

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: AuthUser | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isGerente: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapUser(u: User | null | undefined): AuthUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    fullName:
      (u.user_metadata?.full_name as string | undefined) ??
      (u.user_metadata?.name as string | undefined) ??
      null,
  };
}

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    console.error("Erro ao carregar papéis", error);
    return [];
  }
  return (data ?? []).map((r) => r.role as AppRole);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Listener primeiro (síncrono)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(mapUser(newSession?.user));
      if (newSession?.user) {
        // Adiar busca para evitar deadlock
        setTimeout(() => {
          void fetchRoles(newSession.user.id).then(setRoles);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    // 2) Sessão atual
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(mapUser(data.session?.user));
      if (data.session?.user) {
        void fetchRoles(data.session.user.id).then(setRoles);
      }
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      roles,
      loading,
      isAdmin: roles.includes("admin"),
      isGerente: roles.includes("gerente"),
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      },
    }),
    [session, user, roles, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
