"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
  } from "@/components/ui/select";
  import { Separator } from "@/components/ui/separator";
  import { Loader2, Image as ImageIcon, Plus } from "lucide-react";

type InfoInsert = {
  titulo: string;
  descricao?: string | null;
  foto?: string | null;
  anexo?: string | null;
  tipo_informacao: string;
  estado_informacao: string;
};

type Props = {
  defaultOpen?: boolean;
  onCreated?: (created: { id: string } & InfoInsert & { condominio_id: string }) => void;
  triggerLabel?: string;
};

/** opções (ajuste conforme seus enums do Postgres) */
const TIPO_OPCOES = ["aviso", "noticias", "outro"] as const;
const ESTADO_OPCOES = ["ativo", "inativo"] as const;

export function CreateInfoDialog({ defaultOpen, onCreated, triggerLabel = "Nova Informação" }: Props) {
  const { selected } = useCondominium();

  const [open, setOpen] = React.useState(!!defaultOpen);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<InfoInsert>({
    titulo: "",
    descricao: "",
    foto: "",
    anexo: "",
    tipo_informacao: TIPO_OPCOES[0],
    estado_informacao: ESTADO_OPCOES[0],
  });

  // upload
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = React.useState(false);
  const [fotoProgress, setFotoProgress] = React.useState(0);

  function update<K extends keyof InfoInsert>(key: K, val: InfoInsert[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function uploadFotoToInfoFotos(file: File): Promise<string> {
    setFotoUploading(true);
    setFotoProgress(0);

    if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem válida.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Imagem deve ter até 8MB.");

    // prefixo por usuário para compatibilizar com policies por pasta
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id ?? "anonymous";

    const ext = file.name.split(".").pop() || "jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${userId}/${unique}.${ext}`;

    // onUploadProgress pode não estar tipado em algumas versões
    const { error } = await (supabase.storage
      .from("info_fotos")
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
        // @ts-ignore
        onUploadProgress: (ev: ProgressEvent) => {
          if (ev.lengthComputable) {
            setFotoProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        },
      }) as any);

    if (error) {
      setFotoUploading(false);
      throw new Error(error.message);
    }

    // Se o bucket for público:
    const { data } = supabase.storage.from("info_fotos").getPublicUrl(path);
    setFotoUploading(false);
    return data.publicUrl;
  }

  async function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setErrorMsg(null);
    setFotoPreview(URL.createObjectURL(f));

    try {
      const url = await uploadFotoToInfoFotos(f);
      update("foto", url);
    } catch (err: any) {
      setErrorMsg(err?.message || "Falha ao subir a imagem.");
      setFotoPreview(null);
      update("foto", "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selected?.id) {
      setErrorMsg("Selecione um condomínio.");
      return;
    }
    if (!form.titulo.trim()) {
      setErrorMsg("Informe o título.");
      return;
    }
    if (!form.tipo_informacao || !form.estado_informacao) {
      setErrorMsg("Selecione tipo e estado.");
      return;
    }
    if (fotoUploading) {
      setErrorMsg("Aguarde a imagem terminar de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      // id do admin autenticado (assumindo que auth.uid = admin.id)
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr || !u.user) throw new Error("Sessão inválida.");

      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao?.trim() || null,
        foto: form.foto?.trim() || null,
        anexo: form.anexo?.trim() || null,
        tipo_informacao: form.tipo_informacao,
        estado_informacao: form.estado_informacao,
        admin_id: u.user.id,
        condominio_id: selected.id, // <- vem do contexto
      };

      const { data, error } = await supabase
        .from("info")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      setSuccessMsg("Informação criada com sucesso!");
      onCreated?.({ id: data!.id, ...form, condominio_id: selected.id });

      // reset leve e fechar
      setTimeout(() => {
        setOpen(false);
        setForm({
          titulo: "",
          descricao: "",
          foto: "",
          anexo: "",
          tipo_informacao: TIPO_OPCOES[0],
          estado_informacao: ESTADO_OPCOES[0],
        });
        setFotoPreview(null);
        setFotoProgress(0);
        setSuccessMsg(null);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao criar informação.");
    } finally {
      setSubmitting(false);
    }
  }

  const condominioName = selected?.nome ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar informação</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para criar uma nova informação para o condomínio selecionado.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Condomínio (somente leitura, vindo do contexto) */}
          <div className="grid gap-2">
            <Label htmlFor="condominio">Condomínio</Label>
            <Input
              id="condominio"
              value={condominioName}
              readOnly
              placeholder="Selecione um condomínio"
              className="opacity-90"
            />
            {!selected?.id && (
              <p className="text-xs text-muted-foreground">
                Nenhum condomínio selecionado. Escolha um para continuar.
              </p>
            )}
          </div>

          {/* Título */}
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              placeholder="Ex.: Reunião de condóminos"
              required
              disabled={submitting}
            />
          </div>

          {/* Tipo / Estado */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.tipo_informacao}
                onValueChange={(v) => update("tipo_informacao", v)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPCOES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select
                value={form.estado_informacao}
                onValueChange={(v) => update("estado_informacao", v)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_OPCOES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao ?? ""}
              onChange={(e) => update("descricao", e.target.value)}
              placeholder="Detalhes da informação…"
              rows={4}
              disabled={submitting}
            />
          </div>

          {/* Foto (upload para info_fotos) */}
          <div className="grid gap-2">
            <Label htmlFor="foto">Foto (opcional)</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              onChange={onFotoChange}
              disabled={submitting || fotoUploading}
            />
            {fotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoPreview}
                alt="Pré-visualização"
                className="mt-2 max-h-28 rounded-md border object-contain"
              />
            ) : (
              <div className="mt-2 flex h-24 items-center justify-center rounded-md border text-sm text-muted-foreground">
                <ImageIcon className="mr-2 h-4 w-4" /> sem imagem
              </div>
            )}
            {fotoUploading && (
              <p className="text-sm text-muted-foreground">Enviando imagem… {fotoProgress}%</p>
            )}
            {/* Campo só leitura para mostrar URL final */}
            {form.foto ? (
              <Input value={form.foto} readOnly className="text-xs opacity-70" />
            ) : null}
          </div>

          {/* Anexo (URL opcional) */}
          <div className="grid gap-2">
            <Label htmlFor="anexo">Anexo (URL, opcional)</Label>
            <Input
              id="anexo"
              type="url"
              placeholder="https://exemplo.com/arquivo.pdf"
              value={form.anexo ?? ""}
              onChange={(e) => update("anexo", e.target.value)}
              disabled={submitting}
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <Separator />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || fotoUploading || !selected}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando…
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
