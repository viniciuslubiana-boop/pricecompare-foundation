import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { usersService } from "../services/users.service";
import {
  inviteUser as inviteUserFn,
  setUserRole as setUserRoleFn,
  setUserStatus as setUserStatusFn,
  sendPasswordReset as sendPasswordResetFn,
} from "../services/users.functions";

const KEY = ["admin", "users"] as const;

export function useUsers() {
  return useQuery({ queryKey: KEY, queryFn: () => usersService.list() });
}

export function useInviteUser() {
  const qc = useQueryClient();
  const fn = useServerFn(inviteUserFn);
  return useMutation({
    mutationFn: (data: { email: string; fullName: string; role: "admin" | "gerente" }) =>
      fn({ data }),
    onSuccess: (res) => {
      toast.success(
        res.invited
          ? "Convite enviado por e-mail."
          : "Usuário criado. Configure o envio de convite por e-mail no Lovable Cloud para ativar o convite automático.",
      );
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  const fn = useServerFn(setUserRoleFn);
  return useMutation({
    mutationFn: (data: { userId: string; role: "admin" | "gerente" }) => fn({ data }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  const fn = useServerFn(setUserStatusFn);
  return useMutation({
    mutationFn: (data: { userId: string; status: "active" | "inactive" }) => fn({ data }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === "inactive" ? "Usuário inativado." : "Usuário ativado.");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSendPasswordReset() {
  const fn = useServerFn(sendPasswordResetFn);
  return useMutation({
    mutationFn: (data: { userId: string }) => fn({ data }),
    onSuccess: (res) =>
      toast.success(`Link de redefinição enviado para ${res.email}.`),
    onError: (e: Error) => toast.error(e.message),
  });
}
