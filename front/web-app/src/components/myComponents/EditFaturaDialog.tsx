"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export type Fatura = {
  id: string;
  titulo: string;
  valor: number;
  estado_fatura: "pago" | "pendente" | "cancelado" | string;
  tipo_fatura: "agua" | "luz" | "taxa" | "outro" | string;
  moeda: string;
  descricao?: string | null;
  recibo_url?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  propriedade_id: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: Fatura;
  onSaved?: (updated: Partial<Fatura> & { id: string }) => void;
};

const TIPO_OPCOES = ["agua", "luz", "taxa", "outro"] as const;
const ESTADO_OPCOES = ["pendente", "pago", "cancelado"] as const;

export function EditFaturaDialog({ open, onOpenChange, fatura, onSaved }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [titulo, setTitulo] = React.useState(fatura.titulo);
  const [valor, setValor] = React.useState(String(fatura.valor ?? ""));
  const [tipo, setTipo] = React.useState<Fatura["tipo_fatura"]>(fatura.tipo_fatura);
  const [estado, setEstado] = React.useState<Fatura["estado_fatura"]>(fatura.estado_fatura);
  const [descricao, setDescricao] = React.useState(fatura.descricao ?? "");
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitulo(fatura.titulo);
    setValor(String(fatura.valor ?? ""));
    setTipo(fatura.tipo_fatura);
    setEstado(fatura.estado_fatura);
    setDescricao(fatura.descricao ?? "");
    setErro(null);
  }, [open, fatura]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!titulo.trim() || valor === "") {
      setErro("Preencha título e valor.");
      return;
    }
    const parsed = Number(valor);
    if (Number.isNaN(parsed) || parsed < 0) {
      setErro("Valor inválido.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        valor: parsed,
        tipo_fatura: tipo,
        estado_fatura: estado,
        descricao: descricao.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("fatura").update(payload).eq("id", fatura.id);
      if (error) throw new Error(error.message);

      toast.success("Fatura atualizada!");
      onSaved?.({ id: fatura.id, ...payload });
      onOpenChange(false);
    } catch (err: any) {
      setErro(err?.message || "Falha ao atualizar fatura.");
      toast.error(err?.message || "Falha ao atualizar fatura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar fatura</DialogTitle>
          <DialogDescription>Altere os campos e salve.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Condomínio Outubro"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (€)</Label>
            <Input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)} disabled={saving}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPCOES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v as any)} disabled={saving}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_OPCOES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e[0].toUpperCase() + e.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais…"
              rows={3}
              disabled={saving}
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
