"use client";

import * as React from "react";
import { Loader2, Plus, Home, MapPin, Hash, Layers, ParkingCircle } from "lucide-react";
import { supabase } from "@/api/Client";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// public.tipo_propriedade e public.estado_propriedade
const TIPOS_PROPRIEDADE = [
  { value: "apartamento", label: "Apartamento" },
  { value: "vivenda",     label: "Vivenda" },
];

const ESTADOS_PROPRIEDADE = [
  { value: "disponivel",  label: "Disponível" },
  { value: "ocupada",     label: "Ocupada" },
  { value: "manutencao",  label: "Em Manutenção" },
];

type Condominio = { id: string; nome: string };

export type NewPropriedadeInput = {
  condominio_id: string;
  tipo_propriedade: string;
  estado_propriedade: string;
  rua?: string | null;
  numero?: string | null;
  andar?: string | null;
  tem_estacionamento?: boolean | null;
};

type Props = {
  onCreated?: (p: { id: string } & NewPropriedadeInput & { nome_propriedade: string | null }) => void;
  defaultOpen?: boolean;
  presetCondominioId?: string; // pode vir preenchido, mas não bloqueia o select
};

export function CreatePropriedadeDialog({ onCreated, defaultOpen, presetCondominioId }: Props) {
  const [open, setOpen] = React.useState(!!defaultOpen);

  const [condominios, setCondominios] = React.useState<Condominio[]>([]);
  const [loadingCondos, setLoadingCondos] = React.useState(true);

  const [form, setForm] = React.useState<NewPropriedadeInput>({
    condominio_id: presetCondominioId || "",
    tipo_propriedade: "",
    estado_propriedade: "disponivel", // <- combina com o enum fornecido
    rua: "",
    numero: "",
    andar: "",
    tem_estacionamento: false,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const isApartamento = (form.tipo_propriedade || "") === "apartamento";

  function update<K extends keyof NewPropriedadeInput>(key: K, val: NewPropriedadeInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Mantém o valor vindo de preset em sincronia, mas sem bloquear o select
  React.useEffect(() => {
    if (presetCondominioId && presetCondominioId !== form.condominio_id) {
      update("condominio_id", presetCondominioId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetCondominioId]);

  // Preview local (trigger no DB gera o definitivo)
  const nomePreview = React.useMemo(() => {
    const parts: string[] = [];
    if (form.tipo_propriedade) parts.push(form.tipo_propriedade);
    if (form.rua) parts.push(String(form.rua));
    const numAndar = [form.numero, form.andar].filter(Boolean).join(" ");
    if (numAndar) parts.push(numAndar);
    return parts.join(" — ") || "—";
  }, [form.tipo_propriedade, form.rua, form.numero, form.andar]);

  // Carrega condomínios
  React.useEffect(() => {
    (async () => {
      setLoadingCondos(true);
      const { data, error } = await supabase
        .from("condominio")
        .select("id, nome")
        .order("created_at");
      if (!error && data) {
        setCondominios(data as Condominio[]);
        // Se ainda não houver condominio_id, escolhe o primeiro
        if (!form.condominio_id && data.length > 0) {
          update("condominio_id", data[0].id);
        }
      }
      setLoadingCondos(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.condominio_id)   return setErrorMsg("Selecione um condomínio.");
    if (!form.tipo_propriedade) return setErrorMsg("Selecione o tipo de propriedade.");
    if (!form.estado_propriedade) return setErrorMsg("Selecione o estado da propriedade.");

    // apenas apartamento pode definir estacionamento
    const estaciona = isApartamento ? !!form.tem_estacionamento : false;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("propriedade")
        .insert([{
          condominio_id: form.condominio_id,
          morador_id: null,
          tipo_propriedade: form.tipo_propriedade,
          estado_propriedade: form.estado_propriedade,
          rua: form.rua?.trim() || null,
          numero: form.numero?.trim() || null,
          andar: form.andar?.trim() || null,
          tem_estacionamento: estaciona,
        }])
        .select("id, nome_propriedade")
        .single();

      if (error) throw new Error(error.message);

      setSuccessMsg("Propriedade criada com sucesso!");
      onCreated?.({
        id: data!.id,
        ...form,
        tem_estacionamento: estaciona,
        nome_propriedade: data?.nome_propriedade ?? null,
      });

      setTimeout(() => {
        setOpen(false);
        setSuccessMsg(null);
        setForm((prev) => ({
          condominio_id: presetCondominioId || prev.condominio_id, // mantém a seleção
          tipo_propriedade: "",
          estado_propriedade: "disponivel",
          rua: "",
          numero: "",
          andar: "",
          tem_estacionamento: false,
        }));
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao criar propriedade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Propriedade
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Propriedade</DialogTitle>
          <DialogDescription>Preencha os dados da propriedade. O nome será gerado automaticamente.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleCreate}>
          {/* Condomínio */}
          <div className="grid gap-2">
            <Label>Condomínio</Label>
            <Select
              value={form.condominio_id}
              onValueChange={(val) => update("condominio_id", val)}
              // ← removido o bloqueio por presetCondominioId
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

          {isApartamento && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="andar" className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Andar (opcional)
                </Label>
                <span className="text-xs text-muted-foreground">Disponível apenas para propriedades do tipo Apartamento</span>
                <Input id="andar" placeholder="3B" value={form.andar ?? ""} onChange={(e) => update("andar", e.target.value)} disabled={submitting} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <ParkingCircle className="h-4 w-4" />
                  <div className="flex flex-col">
                    <Label className="leading-tight">Tem estacionamento?</Label>
                    <span className="text-xs text-muted-foreground">Disponível apenas para propriedades do tipo Apartamento</span>
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
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !form.condominio_id || !form.tipo_propriedade || !form.estado_propriedade}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </span>
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
