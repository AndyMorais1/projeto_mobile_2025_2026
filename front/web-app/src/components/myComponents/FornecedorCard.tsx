"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/api/Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Mail, Phone, Tag, MoreVertical, Pencil, Trash2, Loader2, CalendarClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { EditFornecedorDialog } from "@/components/myComponents/EditFornecedorDialog";

/* =========================================================
   TIPOS
========================================================= */

export type ServicoFornecedor = {
  tipo_servico: string;
  preco_medio?: number | null;
};

export type DisponibilidadeRegra = {
  id: string;
  dia_semana: number; // 0=Dom ... 6=Sáb (confirma no teu schema; o teu DIAS_SEMANA usa 0=Dom e 1=Seg)
  hora_inicio: string; // "08:00:00"
  hora_fim: string; // "12:00:00"
};

export type Fornecedor = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  avaliacao_media?: number | null;
  disponibilidade?: boolean | null;

  servicos?: ServicoFornecedor[];

  // 👇 vem da query: fornecedor_disponibilidade_regra(...)
  fornecedor_disponibilidade_regra?: DisponibilidadeRegra[];
};

/* =========================================================
   PROPS
========================================================= */

interface FornecedorCardProps {
  fornecedor: Fornecedor;
  onUpdated?: () => void;
  onDeleted?: (id: string) => void;
}

/* =========================================================
   HELPERS
========================================================= */

const DIA_LABEL: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

function hhmm(t?: string | null) {
  // "08:00:00" -> "08:00"
  if (!t) return "—";
  return t.slice(0, 5);
}

function groupByDia(regras: DisponibilidadeRegra[]) {
  const map = new Map<number, { inicio: string; fim: string }[]>();

  for (const r of regras) {
    const list = map.get(r.dia_semana) ?? [];
    list.push({ inicio: r.hora_inicio, fim: r.hora_fim });
    map.set(r.dia_semana, list);
  }

  // Ordena por dia e por hora
  const ordered = Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([dia, intervalos]) => ({
      dia,
      intervalos: intervalos.sort((x, y) => (x.inicio > y.inicio ? 1 : -1)),
    }));

  return ordered;
}

/* =========================================================
   COMPONENTE
========================================================= */

export function FornecedorCard({ fornecedor, onUpdated, onDeleted }: FornecedorCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const stop: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  async function handleDelete() {
    try {
      setDeleting(true);

      const { error } = await supabase.from("fornecedor").delete().eq("id", fornecedor.id);
      if (error) throw error;

      toast.success("Fornecedor removido com sucesso.");
      onDeleted?.(fornecedor.id);
      setConfirmOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover fornecedor.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleDisponibilidade() {
    try {
      const nova = !fornecedor.disponibilidade;

      const { error } = await supabase.from("fornecedor").update({ disponibilidade: nova }).eq("id", fornecedor.id);
      if (error) throw error;

      toast.success(`Fornecedor marcado como ${nova ? "disponível" : "indisponível"}.`);
      onUpdated?.();
    } catch {
      toast.error("Erro ao atualizar disponibilidade.");
    }
  }

  // ✅ Monta um “resumo” só com regras (dias + horários)
  const regras = fornecedor.fornecedor_disponibilidade_regra ?? [];
  const agendaPorDia = groupByDia(regras);

  return (
    <>
      <Card
        className={cn(
          "group relative rounded-2xl border shadow-sm transition-all",
          "bg-white/90 supports-[backdrop-filter]:bg-white/60 backdrop-blur",
          "border-neutral-200 hover:shadow-lg hover:border-neutral-300"
        )}
      >
        <CardHeader className="flex items-start justify-between gap-4 p-5">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{fornecedor.nome}</CardTitle>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {fornecedor.email || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {fornecedor.telefone || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-xl px-3 py-1 text-xs cursor-pointer",
                fornecedor.disponibilidade
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              )}
              onClick={handleToggleDisponibilidade}
            >
              {fornecedor.disponibilidade ? "Disponível" : "Indisponível"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" onClick={stop}>
                  <MoreVertical className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="mr-2 size-4" /> Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Serviços */}
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Serviços</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fornecedor.servicos?.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="capitalize flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {s.tipo_servico}
                  </span>
                  <span className="font-medium">
                    {s.preco_medio != null ? `€${s.preco_medio.toFixed(2)}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ✅ Agenda (dias + horários) */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase text-muted-foreground">Agenda</Label>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                {agendaPorDia.length ? "Disponibilidade" : "—"}
              </span>
            </div>

            {agendaPorDia.length ? (
              <div className="mt-2 space-y-2">
                {agendaPorDia.map(({ dia, intervalos }) => (
                  <div key={dia} className="rounded-lg border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{DIA_LABEL[dia] ?? `Dia ${dia}`}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {intervalos.length} intervalo(s)
                      </Badge>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      {intervalos.map((it, i) => (
                        <span
                          key={`${dia}-${i}`}
                          className="text-xs rounded-md bg-muted/40 px-2 py-1"
                        >
                          {hhmm(it.inicio)}–{hhmm(it.fim)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Sem disponibilidade configurada (defina dias e horários no editar).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit */}
      <EditFornecedorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        fornecedor={fornecedor}
        onUpdated={onUpdated}
      />

      {/* Delete */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o fornecedor e toda a agenda futura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <span className="flex items-center gap-2">
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
