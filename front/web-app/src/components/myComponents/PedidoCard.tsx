"use client";

import * as React from "react";
import { supabase } from "@/api/Client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Loader2,
  MessageSquareMore,
  Lightbulb,
  CalendarDays,
  Clock3,
  Tag,
  AlertTriangle,
  Euro,
} from "lucide-react";

/* =========================================================
   TIPOS
========================================================= */

export type PedidoEstado = "pendente" | "aprovado" | "rejeitado";

export type Pedido = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_pedido: string;
  estado_pedido: PedidoEstado;
  resposta?: string | null;
  data_prevista?: string | null;
  hora_prevista?: string | null;
  orcamento_max?: number | null;
  urgencia?: "baixa" | "media" | "alta" | string;
};

type CSPSolution = {
  fornecedor_nome: string;
  tipo_servico: string;
  slot_id: string;
  slot_inicio: string;
  score: number;
};

interface PedidoCardProps {
  pedido: Pedido;
  onUpdated?: (partial: { id: string } & Partial<Pedido>) => void;
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function PedidoCard({ pedido, onUpdated }: PedidoCardProps) {
  const [openResposta, setOpenResposta] = React.useState(false);
  const [openSugestoes, setOpenSugestoes] = React.useState(false);

  const [resposta, setResposta] = React.useState(pedido.resposta ?? "");
  const [estado, setEstado] = React.useState<PedidoEstado>(
    pedido.estado_pedido
  );

  const [slotSelecionado, setSlotSelecionado] =
    React.useState<string | null>(null);

  const [solucoes, setSolucoes] = React.useState<CSPSolution[]>([]);
  const [loadingSolucoes, setLoadingSolucoes] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isFechado =
    pedido.estado_pedido === "aprovado" ||
    pedido.estado_pedido === "rejeitado";

  /* =========================================================
     CSP — EDGE FUNCTION
  ========================================================= */

  async function carregarSolucoesCSP() {
    setLoadingSolucoes(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "csp_match_fornecedores",
        {
          body: {
            pedido_id: pedido.id,
            max_solutions: 5,
          },
        }
      );

      if (error) throw error;

      setSolucoes(data?.solutions ?? []);
    } catch (e) {
      console.error("Erro CSP:", e);
      setSolucoes([]);
    } finally {
      setLoadingSolucoes(false);
    }
  }

  /* =========================================================
     SALVAR RESPOSTA
  ========================================================= */

  async function handleSave() {
    setError(null);

    if (!resposta.trim()) {
      setError("A resposta é obrigatória.");
      return;
    }

    if (estado === "aprovado" && !slotSelecionado) {
      setError("Selecione um fornecedor antes de aprovar.");
      return;
    }

    setSaving(true);

    try {
      if (estado === "aprovado") {
        const { error } = await supabase.functions.invoke(
          "pedido_aprovar_com_slot",
          {
            body: {
              pedido_id: pedido.id,
              slot_id: slotSelecionado,
              resposta,
            },
          }
        );

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pedido")
          .update({
            estado_pedido: estado,
            resposta,
          })
          .eq("id", pedido.id);

        if (error) throw error;
      }

      onUpdated?.({
        id: pedido.id,
        estado_pedido: estado,
        resposta,
      });

      setOpenResposta(false);
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pedido.titulo}</CardTitle>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">
            <Tag className="h-3 w-3 mr-1" />
            {pedido.tipo_pedido}
          </Badge>

          {pedido.urgencia && (
            <Badge variant="outline">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {pedido.urgencia}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {pedido.descricao && <p>{pedido.descricao}</p>}

        <Separator />

        {pedido.data_prevista && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {pedido.data_prevista}
          </div>
        )}

        {pedido.hora_prevista && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            {pedido.hora_prevista.slice(0, 5)}
          </div>
        )}

        {pedido.orcamento_max != null && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Euro className="h-4 w-4" />
            €{pedido.orcamento_max.toFixed(2)}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        {/* ================= CSP ================= */}
        <Dialog
          open={openSugestoes}
          onOpenChange={(v) => {
            if (!isFechado) {
              setOpenSugestoes(v);
              if (v) carregarSolucoesCSP();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary" disabled={isFechado}>
              <Lightbulb className="h-4 w-4 mr-1" />
              Sugestões
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Fornecedores compatíveis</DialogTitle>
              <DialogDescription>
                Sugestões geradas automaticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {loadingSolucoes ? (
                <Loader2 className="animate-spin" />
              ) : solucoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma solução encontrada.
                </p>
              ) : (
                solucoes.map((s) => (
                  <div
                    key={s.slot_id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{s.fornecedor_nome}</p>
                        <p className="text-xs capitalize">{s.tipo_servico}</p>
                      </div>
                    </div>

                    <div className="text-xs">
                      {new Date(s.slot_inicio).toLocaleString("pt-PT")}
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const dataHora = new Date(
                          s.slot_inicio
                        ).toLocaleString("pt-PT", {
                          dateStyle: "long",
                          timeStyle: "short",
                        });

                        setSlotSelecionado(s.slot_id);
                        setResposta(
                          `Caro morador,

Informamos que o seu pedido foi aprovado.

O serviço será realizado pelo fornecedor ${s.fornecedor_nome}, no dia ${dataHora}.

Com os melhores cumprimentos,
Gestão do Condomínio`
                        );

                        setOpenSugestoes(false);
                        setOpenResposta(true);
                      }}
                    >
                      Selecionar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= RESPONDER ================= */}
        <Dialog open={openResposta} onOpenChange={setOpenResposta}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={isFechado}>
              <MessageSquareMore className="h-4 w-4 mr-1" />
              Responder
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder pedido</DialogTitle>
            </DialogHeader>

            <Textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              className="min-h-[160px]"
            />

            <Select
              value={estado}
              onValueChange={(value) => setEstado(value as PedidoEstado)}
            >

              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <DialogFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
