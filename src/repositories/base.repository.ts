import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TableName = keyof Database["public"]["Tables"];

/**
 * Minimal repository helpers shared by feature repositories.
 * Real CRUD logic lives in the specific repositories.
 */
export class BaseRepository<T extends TableName> {
  constructor(protected readonly table: T) {}

  protected client() {
    return supabase.from(this.table);
  }

  async listAll() {
    const { data, error } = await this.client()
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string) {
    const query = this.client().select("*") as unknown as {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: Error | null }>;
      };
    };
    const { data, error } = await query.eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const query = this.client().delete() as unknown as {
      eq: (col: string, val: string) => Promise<{ error: Error | null }>;
    };
    const { error } = await query.eq("id", id);
    if (error) throw error;
  }
}
