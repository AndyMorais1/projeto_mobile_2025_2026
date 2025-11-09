"use client";

import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/api/Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";

const CATEGORIAS = [
  "eletricista",
  "canalizador",
  "limpeza",
  "pintura",
  "jardinagem",
  "outro",
];

export function CreateFornecedorDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [avaliacao, setAvaliacao] = React.useState<number | null>(null);
  const [servicos, setServicos] = React.useState<
    { tipo_servico: string; preco_medio: number | null }[]
  >([{ tipo_servico: "eletricista", preco_medio: null }]);
  const [saving, setSaving] = React.useState(false);

  function addServico() {
    setServicos((prev) => [
      ...prev,
      { tipo_servico: "eletricista", preco_medio: null },
    ]);
  }

  function removeServico(idx: number) {
    setServicos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("fornecedor")
        .insert([
          {
            nome: nome.trim(),
            email: email.trim() || null,
            telefone: telefone.trim() || null,
            avaliacao_media: avaliacao ?? 0,
            disponibilidade: true,
          },
        ])
        .select()
        .single();
      if (error) throw error;

      // Inserir serviços
      const validos = servicos.filter((s) => s.tipo_servico);
      if (validos.length > 0) {
        const servicosData = validos.map((s) => ({
          fornecedor_id: data.id,
          tipo_servico: s.tipo_servico,
          preco_medio: s.preco_medio ?? null,
        }));
        const { error: servErr } = await supabase
          .from("fornecedor_servico")
          .insert(servicosData);
        if (servErr) throw servErr;
      }

      toast.success("Fornecedor criado com sucesso!");
      onCreated?.();
      onOpenChange(false);
      setNome("");
      setEmail("");
      setTelefone("");
      setAvaliacao(null);
      setServicos([{ tipo_servico: "eletricista", preco_medio: null }]);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao criar fornecedor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo fornecedor</DialogTitle>
          <DialogDescription>
            Registe um novo fornecedor e os seus serviços.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Avaliação média (0 a 5)</Label>
            <Input
              type="number"
              min={0}
              max={5}
              step="0.1"
              value={avaliacao ?? ""}
              onChange={(e) =>
                setAvaliacao(e.target.value ? parseFloat(e.target.value) : null)
              }
            />
          </div>

          <div>
            <Label>Serviços</Label>
            <div className="space-y-2">
              {servicos.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 border p-2 rounded-lg"
                >
                  <Select
                    value={s.tipo_servico}
                    onValueChange={(v) => {
                      const copy = [...servicos];
                      copy[idx].tipo_servico = v;
                      setServicos(copy);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Preço médio (€)"
                    type="number"
                    step="0.01"
                    value={s.preco_medio ?? ""}
                    onChange={(e) => {
                      const copy = [...servicos];
                      copy[idx].preco_medio = parseFloat(e.target.value) || 0;
                      setServicos(copy);
                    }}
                  />

                  {servicos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeServico(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={addServico}
              >
                <Plus className="h-4 w-4" /> Adicionar serviço
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
