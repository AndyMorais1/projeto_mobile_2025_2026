"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type EstadoUtilizador = "ativo" | "pendente" | "bloqueado";

export function CreateAdminDialog({
  onCreated,
  defaultOpen,
}: {
  onCreated?: (createdId?: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);

  // --------- FORM ---------
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [estado, setEstado] = React.useState<EstadoUtilizador>("ativo");
  const [isSuper, setIsSuper] = React.useState<boolean>(false);
  const [foto, setFoto] = React.useState<string>(""); // URL da foto no storage

  const [submitting, setSubmitting] = React.useState(false);
  const canSubmit = nome.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  // --------- UPLOAD (cópia do seu dialog) ---------
  const [fotoFile, setFotoFile] = React.useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = React.useState(false);
  const [fotoProgress, setFotoProgress] = React.useState<number>(0);

  async function uploadFotoToStorage(file: File): Promise<string> {
    setFotoUploading(true);
    setFotoProgress(0);

    if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Imagem deve ter até 5MB.");

    const ext = file.name.split(".").pop() || "jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `uploads/${unique}.${ext}`;

    const { error } = await (supabase.storage
      .from("user_fotos")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
        // @ts-ignore onUploadProgress ainda não tipado em algumas versões
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

    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));

    try {
      const url = await uploadFotoToStorage(f);
      setFoto(url); // guarda URL pública no estado
    } catch (err: any) {
      toast.error(err?.message || "Falha ao enviar a foto.");
      setFotoFile(null);
      setFotoPreview(null);
      setFotoProgress(0);
      setFoto("");
    }
  }
  // --------- /UPLOAD ---------

  async function handleCreate() {
    if (!canSubmit) {
      toast.error("Preencha nome e e-mail válidos.");
      return;
    }
    if (fotoUploading) {
      toast.error("Aguarde o término do upload da foto.");
      return;
    }

    try {
      setSubmitting(true);

      // JWT do usuário logado para autorizar a Edge Function
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        toast.error("Sessão inválida. Faça login novamente.");
        return;
      }

      // Chama a Edge Function `create-admin`
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-admin`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          estado_utilizador: estado,
          is_super: isSuper,
          foto: foto || null, // URL enviada para a função
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Falha ao criar admin.");
      }

      toast.success(
        json.email_sent
          ? "Admin criado e e-mail enviado com credenciais."
          : "Admin criado, mas o e-mail falhou (verifique configurações de e-mail)."
      );

      setOpen(false);
      setNome("");
      setEmail("");
      setEstado("ativo");
      setIsSuper(false);
      setFoto("");
      setFotoFile(null);
      setFotoPreview(null);
      setFotoProgress(0);

      onCreated?.(json.user_id);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar admin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="default">
          <Plus className="h-4 w-4" />
          Novo Admin
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar administrador</DialogTitle>
          <DialogDescription>
            Preencha os dados. O admin receberá um e-mail com a senha temporária.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Maria de Souza"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="maria@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          {/* Foto: upload para user_fotos (cópia do seu dialog) */}
          <div className="space-y-2">
            <Label htmlFor="foto">Foto (opcional)</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              onChange={onFotoChange}
              disabled={submitting || fotoUploading}
            />
            {fotoPreview && (
              <img
                src={fotoPreview}
                alt="Pré-visualização"
                className="mt-2 max-h-20 rounded-md"
              />
            )}
            {fotoUploading && (
              <p className="text-sm text-muted-foreground">
                Enviando foto… {fotoProgress}%
              </p>
            )}
            {/* Campo somente leitura com a URL preenchida após upload */}
            <Input
              type="text"
              value={foto ?? ""}
              onChange={(e) => setFoto(e.target.value)}
              placeholder="URL da foto (preenchido após upload)"
              disabled
              className="opacity-60"
            />
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado do utilizador</Label>
            <Select
              value={estado}
              onValueChange={(v) => setEstado(v as EstadoUtilizador)}
              disabled={submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Super admin */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label>Super admin</Label>
              <p className="text-sm text-muted-foreground">
                Pode gerir outros administradores.
              </p>
            </div>
            <Switch
              checked={isSuper}
              onCheckedChange={setIsSuper}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={submitting || !canSubmit || fotoUploading}
            className="gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
