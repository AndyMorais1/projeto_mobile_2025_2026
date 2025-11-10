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
import { Loader2, Image as ImageIcon, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

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

  // Upload de foto
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = React.useState(false);
  const [fotoProgress, setFotoProgress] = React.useState(0);

  // Upload de anexo
  const [anexo, setAnexo] = React.useState<string | null>(null);
  const [anexoPreview, setAnexoPreview] = React.useState<string | null>(null);
  const [anexoManual, setAnexoManual] = React.useState("");
  const [anexoUploading, setAnexoUploading] = React.useState(false);
  const [anexoProgress, setAnexoProgress] = React.useState(0);

  function update<K extends keyof InfoInsert>(key: K, val: InfoInsert[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

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

  async function uploadFotoToInfoFotos(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem válida.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Imagem deve ter até 8MB.");
    setFotoUploading(true);
    const url = await uploadToBucket("info_fotos", file);
    setFotoUploading(false);
    return url;
  }

  async function uploadAnexo(file: File): Promise<string> {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf")
      throw new Error("Envie apenas imagens ou PDFs.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Arquivo deve ter até 10MB.");
    setAnexoUploading(true);
    const url = await uploadToBucket("info_anexos", file);
    setAnexoUploading(false);
    return url;
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
      setErrorMsg(err?.message || "Falha ao subir imagem.");
      setFotoPreview(null);
    }
  }

  async function onAnexoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErrorMsg(null);
    setAnexoPreview(f.type === "application/pdf" ? "pdf" : URL.createObjectURL(f));
    try {
      const url = await uploadAnexo(f);
      setAnexo(url);
      setAnexoManual(url);
      toast.success("Anexo enviado com sucesso!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Falha ao enviar anexo.");
      setAnexo(null);
      setAnexoPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selected?.id) return setErrorMsg("Selecione um condomínio.");
    if (!form.titulo.trim()) return setErrorMsg("Informe o título.");
    if (fotoUploading || anexoUploading) return setErrorMsg("Aguarde o upload terminar.");

    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão inválida.");

      const payload = {
        ...form,
        anexo: anexoManual?.trim() || anexo?.trim() || null,
        admin_id: u.user.id,
        condominio_id: selected.id,
      };

      const { data, error } = await supabase.from("info").insert(payload).select("id").single();
      if (error) throw new Error(error.message);

      toast.success("Informação criada!");
      onCreated?.({ id: data.id, ...form, condominio_id: selected.id });

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
        setAnexoPreview(null);
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
          <Plus className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar informação</DialogTitle>
          <DialogDescription>Preencha os dados abaixo.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label>Condomínio</Label>
            <Input value={condominioName} readOnly className="opacity-90" />
          </div>

          <div className="grid gap-2">
            <Label>Título</Label>
            <Input
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              placeholder="Ex.: Reunião de condóminos"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.tipo_informacao} onValueChange={(v) => update("tipo_informacao", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_OPCOES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={form.estado_informacao} onValueChange={(v) => update("estado_informacao", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADO_OPCOES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.descricao ?? ""}
              onChange={(e) => update("descricao", e.target.value)}
              rows={4}
              placeholder="Detalhes…"
            />
          </div>

          {/* Foto */}
          <div className="grid gap-2">
            <Label>Foto</Label>
            <Input type="file" accept="image/*" onChange={onFotoChange} disabled={fotoUploading} />
            {fotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoPreview} alt="Preview" className="max-h-28 rounded-md border object-contain" />
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-4 w-4" /> sem imagem
              </div>
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
            {anexoUploading && <p>Enviando anexo… {anexoProgress}%</p>}
            <Input
              type="url"
              placeholder="ou insira uma URL manual"
              value={anexoManual}
              onChange={(e) => setAnexoManual(e.target.value)}
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <Separator />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
