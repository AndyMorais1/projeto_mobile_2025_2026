"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/api/Client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, Tag, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { EditFornecedorDialog } from "@/components/myComponents/EditFornecedorDialog";

export type ServicoFornecedor = {
  tipo_servico: string;
  preco_medio?: number | null;
};

export type Fornecedor = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  avaliacao_media?: number | null;
  disponibilidade?: boolean | null;
  servicos?: ServicoFornecedor[];
};

interface FornecedorCardProps {
  fornecedor: Fornecedor;
  onUpdated?: () => void;
  onDeleted?: (id: string) => void;
}

export function FornecedorCard({ fornecedor, onUpdated, onDeleted }: FornecedorCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stop: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  async function handleDelete() {
    try {
      setDeleting(true);
      setError(null);
      const { error: delErr } = await supabase
        .from("fornecedor")
        .delete()
        .eq("id", fornecedor.id);

      if (delErr) throw delErr;
      toast.success("Fornecedor removido com sucesso.", { duration: 3000 });
      onDeleted?.(fornecedor.id);
      setConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao remover fornecedor.", {
        duration: 3000,
      });
      setError(err?.message || "Erro ao remover fornecedor.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleDisponibilidade() {
    try {
      const novaDisponibilidade = !fornecedor.disponibilidade;
      const { error } = await supabase
        .from("fornecedor")
        .update({ disponibilidade: novaDisponibilidade })
        .eq("id", fornecedor.id);
      if (error) throw error;

      onUpdated?.();
      toast.success(
        `Fornecedor marcado como ${
          novaDisponibilidade ? "disponível" : "indisponível"
        }.`
      );
    } catch (e) {
      toast.error("Erro ao atualizar disponibilidade.");
    }
  }

  return (
    <>
      <Card
        className={cn(
          "group relative rounded-2xl border shadow-sm transition-all",
          "bg-white/90 supports-[backdrop-filter]:bg-white/60 backdrop-blur dark:bg-neutral-950/50",
          "border-neutral-200 shadow-black/5 hover:shadow-lg hover:border-neutral-300",
          "hover:-translate-y-0.5"
        )}
      >
        <CardHeader className="flex items-start justify-between gap-4 p-5">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-lg font-semibold leading-tight">
              {fornecedor.nome}
            </CardTitle>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <a
                href={`mailto:${fornecedor.email}`}
                onClick={stop}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> {fornecedor.email || "—"}
              </a>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {fornecedor.telefone || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-xl border px-4 mx-2 py-1 text-xs",
                fornecedor.disponibilidade
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              )}
            >
              {fornecedor.disponibilidade ? "Disponível" : "Indisponível"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={stop}
                >
                  <MoreVertical className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" /> Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          {fornecedor.servicos && fornecedor.servicos.length > 0 ? (
            <div>
              <Label className="text-xs uppercase text-muted-foreground">
                Serviços e preços médios
              </Label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fornecedor.servicos.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="capitalize flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {s.tipo_servico}
                    </span>
                    <span className="font-medium">
                      {s.preco_medio != null
                        ? `€${s.preco_medio.toFixed(2)}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço listado.
            </p>
          )}

          <Separator />

          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Avaliação média</span>
            <Badge variant="outline" className="text-xs">
              ⭐ {fornecedor.avaliacao_media?.toFixed(1) ?? "—"} / 5
            </Badge>
          </div>

          {error && (
            <div className="px-2 py-2 text-sm text-rose-600">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditFornecedorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        fornecedor={fornecedor}
        onUpdated={onUpdated}
      />

      {/* Delete Confirm */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai remover o fornecedor e todos os serviços associados.
              Esta operação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Apagando…
                </span>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
