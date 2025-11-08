"use client";

import * as React from "react";
import { Loader2, Home, MapPin, Hash, Layers, ParkingCircle } from "lucide-react";
import { supabase } from "@/api/Client";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";

// Enums UI
const TIPOS_PROPRIEDADE = [
  { value: "apartamento", label: "Apartamento" },
  { value: "vivenda", label: "Vivenda" },
];

const ESTADOS_PROPRIEDADE = [
  { value: "disponivel", label: "Disponível" },
  { value: "ocupada", label: "Ocupada" },
  { value: "manutencao", label: "Em Manutenção" },
];

export type Propriedade = {
  id: string;
  condominio_id: string | null;
  morador_id?: string | null;
  tipo_propriedade: string;
  estado_propriedade: string;
  rua?: string | null;
  numero?: string | null;
  andar?: string | null;
  tem_estacionamento?: boolean | null;
};

type Condominio = { id: string; nome: string };

export function EditCasaDialog({
  open,
  onOpenChange,
  propriedade,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propriedade: Propriedade;
  onSaved?: (p: Partial<Propriedade> & { id: string }) => void;
}) {
  const [condominios, setCondominios] = React.useState<Condominio[]>([]);
  const [loadingCondos, setLoadingCondos] = React.useState(true);

  const [form, setForm] = React.useState<Propriedade>({ ...propriedade });
  const isApartamento = (form.tipo_propriedade || "") === "apartamento";

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setForm({ ...propriedade });
    setErrorMsg(null);
  }, [open, propriedade]);

  React.useEffect(() => {
    (async () => {
      setLoadingCondos(true);
      const { data, error } = await supabase
        .from("condominio")
        .select("id, nome")
        .order("created_at");
      if (!error && data) setCondominios(data as Condominio[]);
      setLoadingCondos(false);
    })();
  }, []);

  function update<K extends keyof Propriedade>(key: K, val: Propriedade[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const nomePreview = React.useMemo(() => {
    const parts: string[] = [];
    if (form.tipo_propriedade) parts.push(form.tipo_propriedade);
    if (form.rua) parts.push(String(form.rua));
    const numAndar = [form.numero, form.andar].filter(Boolean).join(" ");
    if (numAndar) parts.push(numAndar);
    return parts.join(" — ") || "—";
  }, [form.tipo_propriedade, form.rua, form.numero, form.andar]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.condominio_id) return setErrorMsg("Selecione um condomínio.");
    if (!form.tipo_propriedade) return setErrorMsg("Selecione o tipo de propriedade.");
    if (!form.estado_propriedade) return setErrorMsg("Selecione o estado da propriedade.");

    // Regra de consistência: não permitir "ocupada" sem morador
    if ((form.estado_propriedade || "").toLowerCase() === "ocupada" && !form.morador_id) {
      return setErrorMsg("Para marcar como 'ocupada', associe um morador primeiro.");
    }

    const estaciona = isApartamento ? !!form.tem_estacionamento : false;
    const andar = isApartamento ? (form.andar?.trim() || null) : null;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("propriedade")
        .update({
          condominio_id: form.condominio_id,
          tipo_propriedade: form.tipo_propriedade,
          estado_propriedade: form.estado_propriedade,
          rua: form.rua?.trim() || null,
          numero: form.numero?.trim() || null,
          andar,
          tem_estacionamento: estaciona,
          updated_at: new Date().toISOString(),
        })
        .eq("id", propriedade.id);

      if (error) throw new Error(error.message);

      const { id: _oldId, ...formWithoutId } = form;
      onSaved?.({ id: propriedade.id, ...formWithoutId, andar, tem_estacionamento: estaciona });
      onOpenChange(false);
        toast.success("Propriedade atualizada com sucesso.");
    } catch (err: any) {
        toast.error(err?.message || "Erro ao salvar alterações.");
      setErrorMsg(err?.message || "Erro ao salvar alterações.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Propriedade</DialogTitle>
          <DialogDescription>Atualize os dados da casa.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSave}>
          {/* Condomínio */}
          <div className="grid gap-2">
            <Label>Condomínio</Label>
            <Select
              value={form.condominio_id || ""}
              onValueChange={(val) => update("condominio_id", val)}
              disabled={submitting || loadingCondos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCondos ? "Carregando..." : "Selecione um condomínio"} />
              </SelectTrigger>
              <SelectContent>
                {condominios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo / Estado */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo de propriedade</Label>
              <Select
                value={form.tipo_propriedade}
                onValueChange={(val) => update("tipo_propriedade", val)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROPRIEDADE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select
                value={form.estado_propriedade}
                onValueChange={(val) => update("estado_propriedade", val)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_PROPRIEDADE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!form.morador_id && form.estado_propriedade === "ocupada") && (
                <p className="text-xs text-amber-600">Sem morador associado. Altere para "Disponível" ou associe um morador.</p>
              )}
            </div>
          </div>

          {/* Localização */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="rua" className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Rua (opcional)
              </Label>
              <Input id="rua" placeholder="Av. Central" value={form.rua ?? ""} onChange={(e) => update("rua", e.target.value)} disabled={submitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numero" className="inline-flex items-center gap-2">
                <Hash className="h-4 w-4" /> Número (opcional)
              </Label>
              <Input id="numero" placeholder="123" value={form.numero ?? ""} onChange={(e) => update("numero", e.target.value)} disabled={submitting} />
            </div>
          </div>

          {(form.tipo_propriedade === "apartamento") && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="andar" className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Andar (opcional)
                </Label>
                <Input id="andar" placeholder="3B" value={form.andar ?? ""} onChange={(e) => update("andar", e.target.value)} disabled={submitting} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <ParkingCircle className="h-4 w-4" />
                  <div className="flex flex-col">
                    <Label className="leading-tight">Tem estacionamento?</Label>
                    <span className="text-xs text-muted-foreground">Apenas para apartamentos</span>
                  </div>
                </div>
                <Switch checked={!!form.tem_estacionamento} onCheckedChange={(v) => update("tem_estacionamento", v)} disabled={submitting} />
              </div>
            </>
          )}

          {/* Preview */}
          <div className="rounded-lg border p-3">
            <div className="mb-1 text-xs text-muted-foreground">Pré-visualização do nome</div>
            <div className="flex items-center gap-2 font-medium">
              <Home className="h-4 w-4" />
              <span>{nomePreview}</span>
            </div>
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
