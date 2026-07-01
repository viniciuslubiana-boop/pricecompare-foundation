import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, KeyRound } from "lucide-react";
import type { AdminUserRow } from "../services/users.service";
import { useSetUserRole, useSetUserStatus, useSendPasswordReset } from "../hooks/useUsers";

interface Props {
  users: AdminUserRow[];
  currentUserId: string;
}

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy");
  } catch {
    return "-";
  }
}

export function UsersTable({ users, currentUserId }: Props) {
  const setRole = useSetUserRole();
  const setStatus = useSetUserStatus();
  const resetPwd = useSendPasswordReset();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => {
              const role = u.roles.includes("admin")
                ? "admin"
                : u.roles.includes("gerente")
                  ? "gerente"
                  : "gerente";
              const isSelf = u.id === currentUserId;
              const busy =
                (setRole.isPending && setRole.variables?.userId === u.id) ||
                (setStatus.isPending && setStatus.variables?.userId === u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName ?? "-"}</TableCell>
                  <TableCell>{u.email ?? "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={role}
                      onValueChange={(v) =>
                        setRole.mutate({ userId: u.id, role: v as "admin" | "gerente" })
                      }
                      disabled={busy || isSelf}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : "secondary"}>
                      {u.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{fmtDate(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {busy ? (
                      <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        size="sm"
                        variant={u.status === "active" ? "outline" : "default"}
                        disabled={isSelf}
                        onClick={() =>
                          setStatus.mutate({
                            userId: u.id,
                            status: u.status === "active" ? "inactive" : "active",
                          })
                        }
                      >
                        {u.status === "active" ? "Inativar" : "Ativar"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
