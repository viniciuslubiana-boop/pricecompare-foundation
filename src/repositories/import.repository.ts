import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["import_logs"]["Row"];
type Insert = Database["public"]["Tables"]["import_logs"]["Insert"];

class ImportLogRepository {
  async list(): Promise<Row[]> {
    const { data, error } = await supabase
      .from("import_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async create(payload: Insert): Promise<Row> {
    const { data, error } = await supabase
      .from("import_logs")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await supabase.from("import_logs").delete().eq("id", id);
    if (error) throw error;
  }
}

export const importLogRepository = new ImportLogRepository();
export type ImportLog = Row;
