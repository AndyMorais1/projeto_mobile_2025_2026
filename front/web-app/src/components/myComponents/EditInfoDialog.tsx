"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export type Info = {
  id: string;
  titulo: string;
  descricao: string | null;
  foto: string | null;
  anexo: string | null;
  tipo_informacao: string;
  estado_informacao: string;
  admin_id?: string | null;
  condominio_id: string;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  info: Info;
  onSaved?: (updated: Partial<Info> & { id: string }) => void;
};

const TIPO_OPCOES = ["aviso", "noticias", "outro"] as const;
const ESTADO_OPCOES = ["ativo", "inativo"] as const;

export function EditInfoDialog({ open, onOpenChange, info, onSaved }: Props) {
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [titulo, setTitulo] = React.useState(info.titulo);
  const [descricao, setDescricao] = React.useState(info.descricao ?? "");
  const [tipo, setTipo] = React.useState<string>(info.tipo_informacao);
  const [estado, setEstado] = React.useState<string>(info.estado_informacao);
  const [anexo, setAnexo] = React.useState(info.anexo ?? "");

  const [foto, setFoto] = React.useState<string | null>(info.foto ?? null);
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(info.foto ?? null);
  const [fotoUploading, setFotoUploading] = React.useState(false);
  const [fotoProgress, setFotoProgress] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    // rehidrata ao abrir (evita ficar com estado antigo ao editar diferentes cards)
    setTitulo(info.titulo);
    setDescricao(info.descricao ?? "");
    setTipo(info.tipo_informacao);
    setEstado(info.estado_informacao);
    setAnexo(info.anexo ?? "");
    setFoto(info.foto ?? null);
    setFotoPreview(info.foto ?? null);
    setErrorMsg(null);
    setFotoProgress(0);
    setFotoUploading(false);
  }, [open, info]);

  async function uploadFoto(file: File): Promise<string> {
    setFotoUploading(true);
    setFotoProgress(0);

    if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem válida.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Imagem deve ter até 8MB.");

    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id ?? "anonymous";

    const ext = file.name.split(".").pop() || "jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${userId}/${unique}.${ext}`;

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
      const url = await uploadFoto(f);
      setFoto(url);
      toast.success("Imagem enviada.");
    } catch (err: any) {
      setErrorMsg(err?.message || "Falha ao enviar imagem.");
      setFotoPreview(info.foto ?? null);
      setFoto(info.foto ?? null);
    }
  }

  function removeFoto() {
    setFoto(null);
    setFotoPreview(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!titulo.trim()) {
      setErrorMsg("Informe o título.");
      return;
    }
    if (!tipo || !estado) {
      setErrorMsg("Selecione tipo e estado.");
      return;
    }
    if (fotoUploading) {
      setErrorMsg("Aguarde a imagem terminar de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        foto: foto?.trim() || null,
        anexo: anexo.trim() || null,
        tipo_informacao: tipo,
        estado_informacao: estado,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("info").update(payload).eq("id", info.id);
      if (error) throw new Error(error.message);

      toast.success("Informação atualizada!");
      onSaved?.({ id: info.id, ...payload });
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao salvar alterações.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar informação</DialogTitle>
          <DialogDescription>Atualize os campos desejados e salve.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Reunião de condóminos"
              required
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo} disabled={submitting}>
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
              <Select value={estado} onValueChange={setEstado} disabled={submitting}>
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

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Detalhes…"
              disabled={submitting}
            />
          </div>

          {/* Foto */}
          <div className="grid gap-2">
            <Label htmlFor="foto">Foto (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={onFotoChange}
                disabled={submitting || fotoUploading}
              />
              {fotoPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remover foto"
                  onClick={removeFoto}
                  disabled={submitting}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" /> sem imagem
                </div>
              )}
            </div>

            {fotoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoPreview}
                alt="Pré-visualização"
                className="mt-2 max-h-28 rounded-md border object-contain"
              />
            )}
            {fotoUploading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Upload className="h-4 w-4" /> Enviando… {fotoProgress}%
              </p>
            )}
            {foto && <Input value={foto} readOnly className="text-xs opacity-70" />}
          </div>

          {/* Anexo */}
          <div className="grid gap-2">
            <Label htmlFor="anexo">Anexo (URL, opcional)</Label>
            <Input
              id="anexo"
              type="url"
              placeholder="https://exemplo.com/arquivo.pdf"
              value={anexo}
              onChange={(e) => setAnexo(e.target.value)}
              disabled={submitting}
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <Separator />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || fotoUploading}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
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
