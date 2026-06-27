/**
 * Configuração inicial do Supabase.
 *
 * Esta etapa apenas prepara o client. Nenhuma tabela, autenticação ou
 * regra de negócio é implementada agora. Quando as variáveis de ambiente
 * forem definidas (VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY),
 * o client passa a operar normalmente.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;
