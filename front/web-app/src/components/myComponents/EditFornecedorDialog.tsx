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

type CategoriaManutencao =
  | "eletricista"
  | "canalizador"
  | "limpeza"
  | "pintura"
  | "jardinagem"
  | "outro";

type ServicoFornecedor = {
  id?: string;
  tipo_servico: CategoriaManutencao;
  preco_medio?: number | null;
};

export function EditFornecedorDialog({
  open,
  onOpenChange,
  fornecedor,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fornecedor: any;
  onUpdated?: () => void;
}) {
  const [nome, setNome] = React.useState(fornecedor.nome);
  const [email, setEmail] = React.useState(fornecedor.email ?? "");
  const [telefone, setTelefone] = React.useState(fornecedor.telefone ?? "");
  const [avaliacao, setAvaliacao] = React.useState<number>(
    fornecedor.avaliacao_media ?? 0
  );
  const [servicos, setServicos] = React.useState<ServicoFornecedor[]>(
    fornecedor.servicos ?? []
  );
  const [saving, setSaving] = React.useState(false);

  function addServico() {
    setServicos([
      ...servicos,
      { tipo_servico: "eletricista", preco_medio: null },
    ]);
  }

  function removeServico(idx: number) {
    setServicos(servicos.filter((_, i) => i !== idx));
  }

  function updateServico(
    idx: number,
    field: keyof ServicoFornecedor,
    value: any
  ) {
    const updated = [...servicos];
    updated[idx] = { ...updated[idx], [field]: value };
    setServicos(updated);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error: errF } = await supabase
        .from("fornecedor")
        .update({ nome, email, telefone, avaliacao_media: avaliacao })
        .eq("id", fornecedor.id);
      if (errF) throw errF;

      // Remove os serviços antigos e recria os novos
      await supabase
        .from("fornecedor_servico")
        .delete()
        .eq("fornecedor_id", fornecedor.id);

      if (servicos.length > 0) {
        const rows = servicos.map((s) => ({
          fornecedor_id: fornecedor.id,
          tipo_servico: s.tipo_servico,
          preco_medio: s.preco_medio ?? null,
        }));
        const { error: errServ } = await supabase
          .from("fornecedor_servico")
          .insert(rows);
        if (errServ) throw errServ;
      }

      toast.success("Fornecedor atualizado com sucesso!");
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao salvar fornecedor: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Fornecedor</DialogTitle>
          <DialogDescription>
            Atualize as informações, avaliação e serviços do fornecedor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome */}
          <div>
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do fornecedor"
            />
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fornecedor@email.com"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="+351 912 345 678"
              />
            </div>
          </div>

          {/* Avaliação média */}
          <div>
            <Label>Avaliação média (0 a 5)</Label>
            <Input
              type="number"
              min={0}
              max={5}
              step="0.1"
              value={avaliacao}
              onChange={(e) =>
                setAvaliacao(parseFloat(e.target.value) || 0)
              }
              placeholder="4.5"
            />
          </div>

          {/* Serviços */}
          <div className="space-y-2">
            <Label>Serviços oferecidos</Label>
            {servicos.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 border p-2 rounded-lg"
              >
                <Select
                  value={s.tipo_servico}
                  onValueChange={(v) =>
                    updateServico(idx, "tipo_servico", v as CategoriaManutencao)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eletricista">Eletricista</SelectItem>
                    <SelectItem value="canalizador">Canalizador</SelectItem>
                    <SelectItem value="limpeza">Limpeza</SelectItem>
                    <SelectItem value="pintura">Pintura</SelectItem>
                    <SelectItem value="jardinagem">Jardinagem</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  step="0.01"
                  placeholder="Preço médio (€)"
                  value={s.preco_medio ?? ""}
                  onChange={(e) =>
                    updateServico(
                      idx,
                      "preco_medio",
                      parseFloat(e.target.value) || null
                    )
                  }
                  className="w-32"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeServico(idx)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={addServico}
            >
              <Plus className="h-4 w-4" /> Adicionar serviço
            </Button>
          </div>
        </div>

        {/* Ações */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
