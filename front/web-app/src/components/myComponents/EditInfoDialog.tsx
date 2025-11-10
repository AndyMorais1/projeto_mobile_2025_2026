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
  condominio_id: string;
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

  // Foto
  const [foto, setFoto] = React.useState<string | null>(info.foto ?? null);
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(info.foto ?? null);
  const [fotoUploading, setFotoUploading] = React.useState(false);

  // Anexo
  const [anexo, setAnexo] = React.useState<string | null>(info.anexo ?? null);
  const [anexoPreview, setAnexoPreview] = React.useState<string | null>(info.anexo ?? null);
  const [anexoManual, setAnexoManual] = React.useState(info.anexo ?? "");
  const [anexoUploading, setAnexoUploading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitulo(info.titulo);
    setDescricao(info.descricao ?? "");
    setTipo(info.tipo_informacao);
    setEstado(info.estado_informacao);
    setFoto(info.foto ?? null);
    setFotoPreview(info.foto ?? null);
    setAnexo(info.anexo ?? null);
    setAnexoPreview(info.anexo ?? null);
    setAnexoManual(info.anexo ?? "");
  }, [open, info]);

  async function uploadToBucket(bucket: string, file: File): Promise<string> {
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id ?? "anonymous";
    const ext = file.name.split(".").pop() || "dat";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${userId}/${unique}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function onAnexoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErrorMsg(null);
    setAnexoPreview(f.type === "application/pdf" ? "pdf" : URL.createObjectURL(f));
    try {
      setAnexoUploading(true);
      const url = await uploadToBucket("info_anexos", f);
      setAnexo(url);
      setAnexoManual(url);
      toast.success("Anexo enviado!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Falha ao enviar anexo.");
    } finally {
      setAnexoUploading(false);
    }
  }

  async function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErrorMsg(null);
    setFotoPreview(URL.createObjectURL(f));
    try {
      setFotoUploading(true);
      const url = await uploadToBucket("info_fotos", f);
      setFoto(url);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao enviar imagem.");
    } finally {
      setFotoUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return setErrorMsg("Informe o título.");
    if (fotoUploading || anexoUploading) return setErrorMsg("Aguarde o upload terminar.");

    setSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        foto: foto?.trim() || null,
        anexo: anexoManual?.trim() || anexo?.trim() || null,
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
      setErrorMsg(err?.message || "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar informação</DialogTitle>
          <DialogDescription>Atualize os campos e salve.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSave}>
          <Label>Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />

          <Label>Descrição</Label>
          <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_OPCOES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADO_OPCOES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Foto */}
          <div className="grid gap-2">
            <Label>Foto</Label>
            <Input type="file" accept="image/*" onChange={onFotoChange} disabled={fotoUploading} />
            {fotoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoPreview} alt="Foto" className="max-h-28 rounded-md border object-contain" />
            )}
          </div>

          {/* Anexo */}
          <div className="grid gap-2">
            <Label>Anexo (imagem ou PDF)</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={onAnexoChange} disabled={anexoUploading} />
            {anexoPreview && (
              anexoPreview === "pdf" ? (
                <p className="text-sm text-blue-600 underline">📄 PDF pronto</p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={anexoPreview} alt="Anexo" className="max-h-28 rounded-md border object-contain" />
              )
            )}
            <Input
              type="url"
              placeholder="ou insira uma URL manual"
              value={anexoManual}
              onChange={(e) => setAnexoManual(e.target.value)}
            />
          </div>

          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

          <Separator />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
