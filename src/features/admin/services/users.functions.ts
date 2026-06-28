import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteSchema = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "gerente"]),
});

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "gerente"]),
});

const setStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

async function assertAdmin(ctx: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data, error } = await ctx.supabase.rpc("is_admin", { _user_id: ctx.userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem executar esta ação.");
}

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;
    let invited = false;

    // Try invite by email (uses Supabase email template)
    const inviteRes = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName },
    });

    if (inviteRes.error) {
      // Fallback: create user without invite email (no SMTP configured, etc.)
      const created = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        email_confirm: false,
        user_metadata: { full_name: data.fullName },
      });
      if (created.error) throw new Error(created.error.message);
      userId = created.data.user?.id ?? null;
    } else {
      userId = inviteRes.data.user?.id ?? null;
      invited = true;
    }

    if (!userId) throw new Error("Falha ao criar usuário.");

    // handle_new_user trigger insere profile + role='gerente' automaticamente.
    // Atualizamos nome e papel desejado.
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: data.email, full_name: data.fullName });

    if (data.role !== "gerente") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_invited",
      module: "admin",
      record_id: userId,
      new_data: { email: data.email, role: data.role, invited },
    });

    return { userId, invited };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => setRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_role_changed",
      module: "admin",
      record_id: data.userId,
      new_data: { role: data.role },
    });
    return { ok: true };
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => setStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.status === "inactive") {
      throw new Error("Você não pode inativar a si mesmo.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: data.status === "inactive" ? "user_deactivated" : "user_activated",
      module: "admin",
      record_id: data.userId,
      new_data: { status: data.status },
    });
    return { ok: true };
  });
