import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/database.types";

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  status: "active" | "inactive";
  createdAt: string;
  roles: AppRole[];
}

export const usersService = {
  async list(): Promise<AdminUserRow[]> {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = (profiles ?? []).map((p) => p.id);
    let rolesMap = new Map<string, AppRole[]>();
    if (ids.length > 0) {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      if (rolesErr) throw rolesErr;
      for (const r of roles ?? []) {
        const list = rolesMap.get(r.user_id) ?? [];
        list.push(r.role as AppRole);
        rolesMap.set(r.user_id, list);
      }
    }

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      status: (p.status as "active" | "inactive") ?? "active",
      createdAt: p.created_at,
      roles: rolesMap.get(p.id) ?? [],
    }));
  },
};
