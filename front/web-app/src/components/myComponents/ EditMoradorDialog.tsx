"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/api/Client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast} from "sonner";

export type EditMoradorInput = {
  nome: string;
  email: string;
  telefone?: string | null;
  bi?: string | null;
  foto?: string | null;
  estado_utilizador: "ativo" | "inativo" | "pendente" | string;
};

export function EditMoradorDialog({
  open,
  onOpenChange,
  morador,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  morador: {
    id: string;
    nome: string;
    email: string;
    telefone?: string | null;
    bi?: string | null;
    foto?: string | null;
    estado_utilizador: string;
  };
  onUpdated?: (m: { id: string } & Partial<EditMoradorInput>) => void;
}) {
  const [form, setForm] = React.useState<EditMoradorInput>({
    nome: morador.nome,
    email: morador.email,
    telefone: morador.telefone ?? "",
    bi: morador.bi ?? "",
    foto: morador.foto ?? "",
    estado_utilizador: (morador.estado_utilizador as any) || "pendente",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fotoFile, setFotoFile] = React.useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(morador.foto ?? null);
  const [fotoUploading, setFotoUploading] = React.useState(false);
  const [fotoProgress, setFotoProgress] = React.useState<number>(0);

  React.useEffect(() => {
    if (!open) return;
    setForm({
      nome: morador.nome,
      email: morador.email,
      telefone: morador.telefone ?? "",
      bi: morador.bi ?? "",
      foto: morador.foto ?? "",
      estado_utilizador: (morador.estado_utilizador as any) || "pendente",
    });
    setErrorMsg(null);
    setFotoFile(null);
    setFotoPreview(morador.foto ?? null);
    setFotoUploading(false);
    setFotoProgress(0);
  }, [open, morador]);

  function update<K extends keyof EditMoradorInput>(key: K, val: EditMoradorInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function getFunctionsBaseUrl() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (base.includes("127.0.0.1") || base.includes("localhost")) {
    return `${base}/functions/v1`;
  }

  return base.replace(".supabase.co", ".functions.supabase.co");
}

  async function uploadFotoToStorage(file: File): Promise<string> {
    setFotoUploading(true);
    setFotoProgress(0);

    if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Imagem deve ter até 5MB.");

    const ext = file.name.split(".").pop() || "jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `uploads/${morador.id}/${unique}.${ext}`;

    const { error } = await (supabase.storage
      .from("user_fotos")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
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

    const { data } = supabase.storage.from("user_fotos").getPublicUrl(path);
    setFotoUploading(false);
    return data.publicUrl;
  }

  async function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (!f) return;

    setErrorMsg(null);
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));

    try {
      const url = await uploadFotoToStorage(f);
      update("foto", url);
    } catch (err: any) {
      setErrorMsg(err?.message || "Falha ao enviar a foto.");
      setFotoFile(null);
      setFotoPreview(morador.foto ?? null);
      update("foto", morador.foto ?? "");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.nome.trim() || !form.email.trim()) {
      setErrorMsg("Preencha nome e email.");
      return;
    }
    if (fotoUploading) {
      setErrorMsg("Aguarde o término do upload da foto.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData?.session) throw new Error("Sessão inválida. Faça login novamente.");
      const jwt = sessionData.session.access_token;
      const functionsBase = getFunctionsBaseUrl();

      // Usa Edge Function para sincronizar Auth (email, user_metadata) e tabela morador
      const res = await fetch(`${functionsBase}/admin_update_morador`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: morador.id,
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone?.trim() || null,
          bi: form.bi?.trim() || null,
          foto: form.foto?.trim() || null,
          estado_utilizador: form.estado_utilizador || "pendente",
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "Falha ao atualizar morador.");
      }

      onUpdated?.({ id: morador.id, ...form });
      toast.success("Morador atualizado com sucesso.", { duration: 3000 });
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro inesperado ao salvar.");
      toast.error("Erro inesperado ao salvar.", { duration: 3000 });
      return;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Morador</DialogTitle>
          <DialogDescription>Atualize os atributos do utilizador.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              value={form.telefone ?? ""}
              onChange={(e) => update("telefone", e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bi">BI (opcional)</Label>
            <Input
              id="bi"
              value={form.bi ?? ""}
              onChange={(e) => update("bi", e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select
              value={form.estado_utilizador}
              onValueChange={(v) => update("estado_utilizador", v)}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Foto */}
          <div className="grid gap-2">
            <Label htmlFor="foto">Foto (opcional)</Label>
            <Input id="foto" type="file" accept="image/*" onChange={onFotoChange} disabled={submitting || fotoUploading} />
            {fotoPreview && (
              <img src={fotoPreview} alt="Pré-visualização" className="mt-2 max-h-20 rounded-md" />
            )}
            {fotoUploading && (
              <p className="text-sm text-muted-foreground">Enviando foto… {fotoProgress}%</p>
            )}
            <Input
              type="text"
              value={form.foto ?? ""}
              onChange={(e) => update("foto", e.target.value)}
              placeholder="URL da foto"
              disabled
              className="opacity-60"
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

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