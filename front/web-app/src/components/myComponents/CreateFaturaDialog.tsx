"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/api/Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface CreateFaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propriedadeId: string;
  onCreated?: () => void; // callback para recarregar a lista
}

export function CreateFaturaDialog({
  open,
  onOpenChange,
  propriedadeId,
  onCreated,
}: CreateFaturaDialogProps) {
  const [titulo, setTitulo] = React.useState("");
  const [valor, setValor] = React.useState("");
  const [tipo, setTipo] = React.useState<"agua" | "luz" | "taxa" | "outro">(
    "taxa"
  );
  const [descricao, setDescricao] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !valor) {
      toast.error("Preencha título e valor.");
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.from("fatura").insert({
        titulo: titulo.trim(),
        valor: Number(valor),
        estado_fatura: "pendente",
        tipo_fatura: tipo,
        descricao: descricao.trim() || null,
        propriedade_id: propriedadeId,
        moeda: "EUR",
      });
      if (error) throw error;
      toast.success("Fatura criada com sucesso!");
      onCreated?.();
      onOpenChange(false);
      setTitulo("");
      setValor("");
      setDescricao("");
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar fatura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passar fatura</DialogTitle>
          <DialogDescription>
            Criar nova fatura para esta propriedade.
          </DialogDescription>
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
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agua">Água</SelectItem>
                <SelectItem value="luz">Luz</SelectItem>
                <SelectItem value="taxa">Taxa</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais…"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Criar fatura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
