import { supabase } from "@/integrations/supabase/client";

export interface AuditEntry {
  action: string;
  module: string;
  recordId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export const auditService = {
  async log(entry: AuditEntry): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: entry.action,
      module: entry.module,
      record_id: entry.recordId ?? null,
      old_data: (entry.oldData ?? null) as never,
      new_data: (entry.newData ?? null) as never,
    });
  },
};
