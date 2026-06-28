import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteUser } from "../hooks/useUsers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "gerente">("gerente");
  const invite = useInviteUser();

  function reset() {
    setFullName("");
    setEmail("");
    setRole("gerente");
  }

  async function submit() {
    await invite.mutateAsync(
      { fullName, email, role },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            Crie um novo acesso ao sistema. O usuário receberá um e-mail se o envio de convites
            estiver ativo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com.br"
            />
          </div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "gerente")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={invite.isPending || !email || !fullName}
          >
            {invite.isPending ? "Enviando..." : "Convidar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
