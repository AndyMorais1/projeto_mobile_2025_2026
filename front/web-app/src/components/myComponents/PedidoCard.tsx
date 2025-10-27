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
import { Label } from "@/components/ui/label";
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
import { Loader2, MessageSquareMore } from "lucide-react";

// ----- Types -----
export type PedidoEstado = "pendente" | "aprovado" | "rejeitado" | string;

export type Pedido = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_pedido: string;
  estado_pedido: PedidoEstado;
  resposta?: string | null;
  created_at: string;
  updated_at: string;
  morador_id: string | null;
  // Optional expanded relation if your query joins morador
  morador?: { id: string; nome?: string | null; email?: string | null } | null;
};

// Propriedade (casa) vinculada ao morador
type Casa = {
  id: string;
  nome_propriedade: string | null;
};

interface PedidoCardProps {
  pedido: Pedido;
  onUpdated?: (partial: { id: string } & Partial<Pedido>) => void;
}

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";

function fmtDateTime(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat(LOCALE, {
      dateStyle: "short",
      timeStyle: "short",
      hour12: false,
      timeZone: TIMEZONE,
    }).format(d);
  } catch {
    return s;
  }
}

export default function PedidoCard({ pedido, onUpdated }: PedidoCardProps) {
  const [open, setOpen] = React.useState(false);
  const [resposta, setResposta] = React.useState(pedido.resposta ?? "");
  const [estado, setEstado] = React.useState<PedidoEstado>(
    pedido.estado_pedido
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // --- Casa(s) do morador ---
  const [casas, setCasas] = React.useState<Casa[] | null>(null);
  const [cLoading, setCLoading] = React.useState(false);
  const [cError, setCError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Keep dialog fields in sync if parent updates the card
    setResposta(pedido.resposta ?? "");
    setEstado(pedido.estado_pedido);
  }, [pedido.id]);

  React.useEffect(() => {
    // Carrega as casas vinculadas ao morador deste pedido
    (async () => {
      if (!pedido.morador_id) {
        setCasas([]);
        return;
      }
      setCLoading(true);
      setCError(null);
      try {
        const { data, error } = await supabase
          .from("propriedade")
          .select("id,nome_propriedade,rua,numero,andar,condominio_id")
          .eq("morador_id", pedido.morador_id);
        if (error) throw error;
        setCasas((data as unknown as Casa[]) ?? []);
      } catch (e: any) {
        setCError(e?.message ?? "Falha ao carregar a casa do morador");
        setCasas([]);
      } finally {
        setCLoading(false);
      }
    })();
  }, [pedido.morador_id]);

  async function handleSave() {
    setError(null);
    if (!resposta.trim() || !estado) {
      setError("Preencha a resposta e selecione o estado do pedido.");
      return;
    }

    setSaving(true);
    try {
      const { error: upErr, data } = await supabase
        .from("pedido")
        .update({ resposta: resposta.trim(), estado_pedido: estado })
        .eq("id", pedido.id)
        .select("id,resposta,estado_pedido,updated_at")
        .single();

      if (upErr) throw upErr;

      onUpdated?.({
        id: pedido.id,
        resposta: data?.resposta ?? null,
        estado_pedido: (data?.estado_pedido as PedidoEstado) ?? estado,
        updated_at: data?.updated_at ?? new Date().toISOString(),
      });
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao salvar resposta.");
    } finally {
      setSaving(false);
    }
  }

  const estadoColor: Record<string, string> = {
    pendente: "bg-amber-100 text-amber-800",
    aprovado: "bg-emerald-100 text-emerald-800",
    rejeitado: "bg-rose-100 text-rose-800",
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl font-semibold leading-tight">
            {pedido.titulo}
          </CardTitle>
          <Badge
            className={
              "capitalize " + (estadoColor[pedido.estado_pedido] ?? "")
            }
          >
            {pedido.estado_pedido}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="capitalize">
            {pedido.tipo_pedido}
          </Badge>
          <span>•</span>
          <span>Criado: {fmtDateTime(pedido.created_at)}</span>
          {pedido.morador?.nome && (
            <>
              <span>•</span>
              <span>Morador: {pedido.morador.nome}</span>
            </>
          )}
          {/* Casa(s) do morador */}
          <>
            <span>•</span>
            {cLoading ? (
              <span>Casa: carregando...</span>
            ) : cError ? (
              <span className="text-rose-600">Casa: erro ao carregar</span>
            ) : casas && casas.length > 0 ? (
              <span>
                Casa:{" "}
                {casas
                  .map((c) => c.nome_propriedade || "<sem nome>")
                  .join(", ")}
              </span>
            ) : (
              <span>Casa: —</span>
            )}
          </>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {pedido.descricao && (
          <div>
            <Label className="text-xs uppercase text-muted-foreground">
              Descrição
            </Label>
            <p className="mt-1 whitespace-pre-wrap">{pedido.descricao}</p>
          </div>
        )}

        <Separator />

        {pedido.resposta ? (
          <div>
            <Label className="text-xs uppercase text-muted-foreground">
              Resposta do admin
            </Label>
            <p className="mt-1 whitespace-pre-wrap">{pedido.resposta}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem resposta ainda.</p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-3">
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen) {
              setResposta(pedido.resposta ?? "");
              setEstado(pedido.estado_pedido);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              <MessageSquareMore className="h-4 w-4" /> Responder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Responder pedido</DialogTitle>
              <DialogDescription>
                Escreva uma resposta e atualize o estado do pedido.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="resposta">Resposta</Label>
                <Textarea
                  id="resposta"
                  placeholder="Digite a resposta para o morador..."
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado do pedido</Label>
                <Select
                  value={estado}
                  onValueChange={(v) => setEstado(v as PedidoEstado)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !resposta.trim() || !estado}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
