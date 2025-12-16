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

/* -------------------- Tipos -------------------- */

type CategoriaManutencao =
  | "eletricista"
  | "canalizador"
  | "limpeza"
  | "pintura"
  | "jardinagem"
  | "outro";

type ServicoFornecedor = {
  tipo_servico: CategoriaManutencao;
  preco_medio?: number | null;
};

type Intervalo = {
  inicio: string;
  fim: string;
};

/* -------------------- Utils -------------------- */

// 🔑 converte DD/MM/YYYY → YYYY-MM-DD
function toISODate(value?: string | null) {
  if (!value) return "";
  if (value.includes("/")) {
    const [d, m, y] = value.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return value;
}

/* -------------------- Componente -------------------- */

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
  /* -------- Dados básicos -------- */
  const [nome, setNome] = React.useState(fornecedor.nome);
  const [email, setEmail] = React.useState(fornecedor.email ?? "");
  const [telefone, setTelefone] = React.useState(fornecedor.telefone ?? "");

  /* -------- Serviços -------- */
  const [servicos, setServicos] = React.useState<ServicoFornecedor[]>(
    fornecedor.servicos ?? []
  );

  /* -------- Disponibilidade / Agenda -------- */
  const [periodoInicio, setPeriodoInicio] = React.useState(
    toISODate(fornecedor.periodo_inicio)
  );
  const [periodoFim, setPeriodoFim] = React.useState(
    toISODate(fornecedor.periodo_fim)
  );

  const [diasSemana, setDiasSemana] = React.useState<number[]>(
    fornecedor.dias_semana ?? [1, 2, 3, 4, 5]
  );

  const [duracaoSlot, setDuracaoSlot] = React.useState(
    fornecedor.duracao_slot_minutos ?? 60
  );

  const [intervalos, setIntervalos] = React.useState<Intervalo[]>(
    fornecedor.intervalos ?? [{ inicio: "08:00", fim: "12:00" }]
  );

  const [saving, setSaving] = React.useState(false);

  /* -------------------- Helpers -------------------- */

  function addServico() {
    setServicos((p) => [
      ...p,
      { tipo_servico: "eletricista", preco_medio: null },
    ]);
  }

  function removeServico(idx: number) {
    setServicos((p) => p.filter((_, i) => i !== idx));
  }

  function updateServico(
    idx: number,
    field: keyof ServicoFornecedor,
    value: any
  ) {
    const copy = [...servicos];
    copy[idx] = { ...copy[idx], [field]: value };
    setServicos(copy);
  }

  function toggleDiaSemana(dia: number) {
    setDiasSemana((p) =>
      p.includes(dia) ? p.filter((d) => d !== dia) : [...p, dia]
    );
  }

  function addIntervalo() {
    setIntervalos((p) => [...p, { inicio: "14:00", fim: "18:00" }]);
  }

  function removeIntervalo(idx: number) {
    setIntervalos((p) => p.filter((_, i) => i !== idx));
  }

  /* -------------------- Save -------------------- */

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }

    if (!periodoInicio || !periodoFim) {
      toast.error("Defina o período da agenda.");
      return;
    }

    if (diasSemana.length === 0) {
      toast.error("Selecione pelo menos um dia da semana.");
      return;
    }

    setSaving(true);

    try {
      await supabase.functions.invoke("fornecedor_upsert_com_agenda", {
        body: {
          fornecedor: {
            id: fornecedor.id,
            nome: nome.trim(),
            email: email.trim() || null,
            telefone: telefone.trim() || null,
            duracao_slot_minutos: duracaoSlot,
          },
          servicos,
          agenda: {
            periodo_inicio: periodoInicio,
            periodo_fim: periodoFim,
            dias_semana: diasSemana,
            intervalos,
          },
        },
      });

      toast.success("Fornecedor atualizado com sucesso!");
      onUpdated?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar fornecedor.");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- UI -------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar fornecedor</DialogTitle>
          <DialogDescription>
            Atualize dados, serviços e disponibilidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dados básicos */}
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          {/* Serviços */}
          <div>
            <Label>Serviços</Label>
            {servicos.map((s, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <Select
                  value={s.tipo_servico}
                  onValueChange={(v) =>
                    updateServico(idx, "tipo_servico", v)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
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
                  value={s.preco_medio ?? ""}
                  onChange={(e) =>
                    updateServico(
                      idx,
                      "preco_medio",
                      parseFloat(e.target.value) || null
                    )
                  }
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

            <Button variant="outline" className="mt-2" onClick={addServico}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar serviço
            </Button>
          </div>

          {/* Disponibilidade */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-base">Disponibilidade</Label>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
              <Input
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={diasSemana.includes(d) ? "default" : "outline"}
                  onClick={() => toggleDiaSemana(d)}
                >
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d]}
                </Button>
              ))}
            </div>

            <Label>Duração do slot (min)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={duracaoSlot}
              onChange={(e) => setDuracaoSlot(Number(e.target.value))}
            />

            <Label>Horários</Label>
            {intervalos.map((h, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="time"
                  value={h.inicio}
                  onChange={(e) => {
                    const c = [...intervalos];
                    c[idx].inicio = e.target.value;
                    setIntervalos(c);
                  }}
                />
                <Input
                  type="time"
                  value={h.fim}
                  onChange={(e) => {
                    const c = [...intervalos];
                    c[idx].fim = e.target.value;
                    setIntervalos(c);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIntervalo(idx)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addIntervalo}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar horário
            </Button>
          </div>
        </div>

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
