"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Phone, User as UserIcon, Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

type TipoCondominio = "horizontal" | "vertical" | "misto";

export interface EditContato {
  id?: string;           // undefined => novo contato
  telefone: string;
  entidade: string;
  _deleted?: boolean;    // marcação local para exclusão
}

export interface EditCondominio {
  id: string;
  nome: string;
  endereco: string;
  tipo_condominio: TipoCondominio;
  contatos?: EditContato[];
}

export function EditCondominioDialog({
  open,
  onOpenChange,
  condominio,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominio: EditCondominio;
  onSaved?: (updated: Partial<EditCondominio> & { id: string }) => void;
}) {
  const [nome, setNome] = React.useState(condominio.nome || "");
  const [endereco, setEndereco] = React.useState(condominio.endereco || "");
  const [tipo, setTipo] = React.useState<TipoCondominio>(
    (condominio.tipo_condominio as TipoCondominio) || "horizontal"
  );
  const [contatos, setContatos] = React.useState<EditContato[]>(
    condominio.contatos?.map(c => ({ ...c })) || [{ telefone: "", entidade: "" }]
  );

  const [submitting, setSubmitting] = React.useState(false);

  // Recarrega estado ao abrir com dados frescos
  React.useEffect(() => {
    if (!open) return;
    setNome(condominio.nome || "");
    setEndereco(condominio.endereco || "");
    setTipo((condominio.tipo_condominio as TipoCondominio) || "horizontal");

    // Busca contatos atuais direto da tabela base (evita defasagem de view)
    (async () => {
      const { data, error } = await supabase
        .from("contato_condominio")
        .select("id, telefone, entidade")
        .eq("condominio_id", condominio.id)
        .order("created_at", { ascending: true });

      if (error) {
        // fallback para os que vieram do card
        setContatos(condominio.contatos?.map(c => ({ ...c })) || [{ telefone: "", entidade: "" }]);
        return;
      }

      const rows = (data || []).map((r: any) => ({
        id: r.id as string,
        telefone: r.telefone as string,
        entidade: r.entidade as string,
      }));
      setContatos(rows.length ? rows : [{ telefone: "", entidade: "" }]);
    })();
  }, [open, condominio]);

  function addContato() {
    setContatos(prev => [...prev, { telefone: "", entidade: "" }]);
  }

  function removeContato(idx: number) {
    setContatos(prev => {
      const curr = [...prev];
      // se for novo (sem id), remove de vez; se for existente, marca _deleted
      const c = curr[idx];
      if (!c.id) {
        curr.splice(idx, 1);
      } else {
        curr[idx] = { ...c, _deleted: true };
      }
      return curr.length ? curr : [{ telefone: "", entidade: "" }];
    });
  }

  function updateContato(idx: number, field: keyof EditContato, value: string | boolean) {
    setContatos(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !endereco.trim() || !tipo) {
      toast.error("Preencha Nome, Endereço e Tipo.");
      return;
    }

    try {
      setSubmitting(true);

      // 1) Atualiza dados principais do condomínio
      const { error: updErr } = await supabase
        .from("condominio")
        .update({
          nome: nome.trim(),
          endereco: endereco.trim(),
          tipo_condominio: tipo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", condominio.id);

      if (updErr) throw updErr;

      // 2) Diff de contactos
      //    - deletar marcados _deleted
      const toDelete = contatos.filter(c => !!c.id && c._deleted);
      if (toDelete.length) {
        const { error: delErr } = await supabase
          .from("contato_condominio")
          .delete()
          .in("id", toDelete.map(c => c.id));
        if (delErr) throw delErr;
      }

      //    - atualizar os que têm id e não estão _deleted
      const toUpdate = contatos.filter(c => !!c.id && !c._deleted)
        .filter(c => c.telefone.trim() && c.entidade.trim());
      for (const c of toUpdate) {
        const { error: uErr } = await supabase
          .from("contato_condominio")
          .update({
            telefone: c.telefone.trim(),
            entidade: c.entidade.trim(),
          })
          .eq("id", c.id);
        if (uErr) throw uErr;
      }

      //    - inserir novos (sem id), válidos
      const toInsert = contatos.filter(c => !c.id && !c._deleted)
        .filter(c => c.telefone.trim() && c.entidade.trim());
      if (toInsert.length) {
        const { error: iErr } = await supabase
          .from("contato_condominio")
          .insert(
            toInsert.map(c => ({
              condominio_id: condominio.id,
              telefone: c.telefone.trim(),
              entidade: c.entidade.trim(),
            }))
          );
        if (iErr) throw iErr;
      }

      toast.success("Condomínio atualizado!");
      onSaved?.({
        id: condominio.id,
        nome,
        endereco,
        tipo_condominio: tipo,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Falha ao salvar alterações.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Editar condomínio
          </DialogTitle>
          <DialogDescription>Atualize os dados e contactos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-3">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label>Tipo de condomínio</Label>
            <Select value={tipo} onValueChange={(v: TipoCondominio) => setTipo(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
                <SelectItem value="misto">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contactos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Contactos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addContato}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>

            {contatos.map((c, i) => (
              <div
                key={c.id ?? `new-${i}`}
                className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end border rounded-xl p-3 ${c._deleted ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="size-3" /> Telefone
                  </Label>
                  <Input
                    placeholder="Ex: 912345678"
                    value={c.telefone}
                    onChange={(e) => updateContato(i, "telefone", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <UserIcon className="size-3" /> Entidade
                  </Label>
                  <Input
                    placeholder="Ex: Síndico, Portaria, Limpeza"
                    value={c.entidade}
                    onChange={(e) => updateContato(i, "entidade", e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContato(i)}
                    title="Remover contacto"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
