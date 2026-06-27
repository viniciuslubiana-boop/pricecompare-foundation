import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Power, PowerOff, Trash2, ExternalLink } from "lucide-react";
import { CompetitorStatusBadge } from "./CompetitorStatusBadge";
import type { Competitor, CompetitorStatus } from "../types/competitor.types";

interface Props {
  rows: Competitor[];
  onEdit: (c: Competitor) => void;
  onToggleStatus: (c: Competitor) => void;
  onDelete: (c: Competitor) => void;
}

export function CompetitorTable({ rows, onEdit, onToggleStatus, onDelete }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[170px]">Última atualização</TableHead>
            <TableHead className="w-[140px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const status = (c.status as CompetitorStatus) ?? "active";
            return (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="max-w-[280px] truncate">{c.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell>
                  <CompetitorStatusBadge status={status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.updated_at ? new Date(c.updated_at).toLocaleString("pt-BR") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(c)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onToggleStatus(c)}
                      aria-label={status === "active" ? "Desativar" : "Ativar"}
                      title={status === "active" ? "Desativar" : "Ativar"}
                    >
                      {status === "active" ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(c)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
