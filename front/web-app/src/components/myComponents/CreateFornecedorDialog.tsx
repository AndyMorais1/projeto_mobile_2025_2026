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

/* -------------------- Constantes -------------------- */

const CATEGORIAS = [
  "eletricista",
  "canalizador",
  "limpeza",
  "pintura",
  "jardinagem",
  "outro",
];

const DIAS_SEMANA = [
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
  { id: 0, label: "Dom" },
];

/* -------------------- Componente -------------------- */

export function CreateFornecedorDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  /* -------- Dados básicos -------- */
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefone, setTelefone] = React.useState("");

  /* -------- Serviços -------- */
  const [servicos, setServicos] = React.useState<
    { tipo_servico: string; preco_medio: number | null }[]
  >([{ tipo_servico: "eletricista", preco_medio: null }]);

  /* -------- Disponibilidade -------- */
  const [periodoInicio, setPeriodoInicio] = React.useState("");
  const [periodoFim, setPeriodoFim] = React.useState("");
  const [diasSemana, setDiasSemana] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [duracaoSlot, setDuracaoSlot] = React.useState(60);
  const [intervalos, setIntervalos] = React.useState<
    { inicio: string; fim: string }[]
  >([{ inicio: "08:00", fim: "12:00" }]);

  const [saving, setSaving] = React.useState(false);

  /* -------------------- Helpers -------------------- */

  function addServico() {
    setServicos((p) => [...p, { tipo_servico: "eletricista", preco_medio: null }]);
  }

  function removeServico(idx: number) {
    setServicos((p) => p.filter((_, i) => i !== idx));
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

      toast.success("Fornecedor criado com sucesso!");
      onCreated?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar fornecedor.");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- UI -------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo fornecedor</DialogTitle>
          <DialogDescription>
            Registe o fornecedor, serviços e disponibilidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Dados básicos */}
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>

          {/* Serviços */}
          <div>
            <Label>Serviços</Label>
            {servicos.map((s, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <Select
                  value={s.tipo_servico}
                  onValueChange={(v) => {
                    const c = [...servicos];
                    c[idx].tipo_servico = v;
                    setServicos(c);
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
                    const c = [...servicos];
                    c[idx].preco_medio = parseFloat(e.target.value) || 0;
                    setServicos(c);
                  }}
                />

                {servicos.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeServico(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
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
              <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
              <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((d) => (
                <Button
                  key={d.id}
                  variant={diasSemana.includes(d.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDiaSemana(d.id)}
                >
                  {d.label}
                </Button>
              ))}
            </div>

            <div>
              <Label>Duração do slot (min)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={duracaoSlot}
                onChange={(e) => setDuracaoSlot(Number(e.target.value))}
              />
            </div>

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
                <Button variant="ghost" size="icon" onClick={() => removeIntervalo(idx)}>
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
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
