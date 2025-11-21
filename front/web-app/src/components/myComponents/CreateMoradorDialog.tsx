"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
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
import { es } from "date-fns/locale";

export type NewMoradorInput = {
  nome: string;
  email: string;
  telefone?: string | null;
  bi?: string | null;
  foto?: string | null; // será preenchido com a URL do Storage
};

type Props = {
  onCreated?: (morador: { id: string } & NewMoradorInput & {
    condominio_id: string;
    propriedade_id: string;
  }) => void;
  defaultOpen?: boolean;
};

function getFunctionsBaseUrl() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (base.includes("127.0.0.1") || base.includes("localhost")) {
    return `${base}/functions/v1`;
  }

  return base.replace(".supabase.co", ".functions.supabase.co");
}


type Condominio = { id: string; nome: string };
type Propriedade = { id: string; rua: string | null; numero: string | null; andar: string | null; nome_propriedade: string };

export function CreateMoradorDialog({ onCreated, defaultOpen }: Props) {
  const [open, setOpen] = React.useState(!!defaultOpen);

  const [form, setForm] = React.useState<NewMoradorInput>({
    nome: "", email: "", telefone: "", bi: "", foto: "",
  });

  const [condominios, setCondominios] = React.useState<Condominio[]>([]);
  const [propriedades, setPropriedades] = React.useState<Propriedade[]>([]);
  const [condominioId, setCondominioId] = React.useState<string>("");
  const [propriedadeId, setPropriedadeId] = React.useState<string>("");

  const [submitting, setSubmitting] = React.useState(false);
  const [loadingCondos, setLoadingCondos] = React.useState(true);
  const [loadingProps, setLoadingProps] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // ---- estados do upload de foto ----
  const [fotoFile, setFotoFile] = React.useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = React.useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = React.useState(false);
  const [fotoProgress, setFotoProgress] = React.useState<number>(0);

  function update<K extends keyof NewMoradorInput>(key: K, val: NewMoradorInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // 1) Carrega condomínios
  React.useEffect(() => {
    (async () => {
      setLoadingCondos(true);
      const { data, error } = await supabase
        .from("condominio")
        .select("id, nome")
        .order("created_at");
      if (!error && data) {
        setCondominios(data as Condominio[]);
        if (!condominioId && data.length > 0) setCondominioId(data[0].id);
      }
      setLoadingCondos(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // inicial

  // 2) Carrega propriedades do condomínio selecionado (apenas disponíveis)
  React.useEffect(() => {
    if (!condominioId) {
      setPropriedades([]);
      setPropriedadeId("");
      return;
    }
    (async () => {
      setLoadingProps(true);
      const { data, error } = await supabase
        .from("propriedade")
        .select("id, rua, numero, andar, morador_id, condominio_id, nome_propriedade")
        .eq("condominio_id", condominioId)
        .is("morador_id", null) // só disponíveis (sem morador)
        .order("created_at");
      if (!error && data) {
        const list = data.map((p) => ({
          id: p.id,
          rua: p.rua,
          numero: p.numero,
          andar: p.andar,
          nome_propriedade: p.nome_propriedade,
        })) as Propriedade[];
        setPropriedades(list);
        setPropriedadeId(list[0]?.id ?? "");
      } else {
        setPropriedades([]);
        setPropriedadeId("");
      }
      setLoadingProps(false);
    })();
  }, [condominioId]);

  // 3) Upload da foto para o bucket user_fotos
  async function uploadFotoToStorage(file: File): Promise<string> {
    setFotoUploading(true);
    setFotoProgress(0);

    // validações
    if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Imagem deve ter até 5MB.");

    const ext = file.name.split(".").pop() || "jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `uploads/${unique}.${ext}`; // você pode trocar para auth.uid()/... se quiser

    // Algumas versões do supabase-js ainda não declaram onUploadProgress nos tipos
    const { error } = await (supabase.storage
      .from("user_fotos")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
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

    // Se o bucket user_fotos for PÚBLICO:
    const { data } = supabase.storage.from("user_fotos").getPublicUrl(path);
    setFotoUploading(false);
    return data.publicUrl;

    // Se o bucket for PRIVADO, use URL assinada:
    // const { data: signed, error: signErr } = await supabase.storage
    //   .from("user_fotos").createSignedUrl(path, 60 * 60);
    // if (signErr) { setFotoUploading(false); throw new Error(signErr.message); }
    // setFotoUploading(false);
    // return signed.signedUrl;
  }

  // 4) Handler do input de arquivo: sobe a foto e preenche form.foto
  async function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (!f) return;

    setErrorMsg(null);
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));

    try {
      const url = await uploadFotoToStorage(f);
      update("foto", url); // mantém o fluxo atual (Edge Function recebe string)
    } catch (err: any) {
      setErrorMsg(err?.message || "Falha ao enviar a foto.");
      setFotoFile(null);
      setFotoPreview(null);
      update("foto", "");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.nome.trim() || !form.email.trim()) {
      setErrorMsg("Preencha nome e email.");
      return;
    }
    if (!condominioId) {
      setErrorMsg("Selecione um condomínio.");
      return;
    }
    if (!propriedadeId) {
      setErrorMsg("Selecione uma casa/propriedade do condomínio.");
      return;
    }
    if (fotoUploading) {
      setErrorMsg("Aguarde o término do upload da foto.");
      return;
    }

    setSubmitting(true);
    try {
      // Pega o JWT
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData?.session) throw new Error("Sessão inválida. Faça login novamente.");
      const jwt = sessionData.session.access_token;

      // 5) Cria morador via Edge Function (envia email + senha temporária)
      const functionsBase = getFunctionsBaseUrl();
      const res = await fetch(`${functionsBase}/admin_create_morador`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone?.trim() || null,
          bi: form.bi?.trim() || null,
          foto: form.foto?.trim() || null, // já com URL vinda do Storage
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload?.ok || !payload?.user_id) {
        throw new Error(payload?.error || "Falha ao criar morador.");
      }
      const newUserId: string = payload.user_id;

      // 6) Atribui a propriedade ao morador recém-criado
      const { error: updErr } = await supabase
        .from("propriedade")
        .update({ morador_id: newUserId, estado_propriedade: "ocupada" })
        .eq("id", propriedadeId)
        .eq("condominio_id", condominioId)
        .is("morador_id", null);

      if (updErr) {
        throw new Error(`Morador criado, mas falhou atribuir a propriedade: ${updErr.message}`);
      }

      setSuccessMsg("Morador criado e propriedade atribuída com sucesso!");

      onCreated?.({
        id: newUserId,
        ...form,
        condominio_id: condominioId,
        propriedade_id: propriedadeId,
      });

      setTimeout(() => {
        setOpen(false);
        setForm({ nome: "", email: "", telefone: "", bi: "", foto: "" });
        setFotoFile(null);
        setFotoPreview(null);
        setFotoProgress(0);
        setSuccessMsg(null);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro inesperado ao criar morador.");
    } finally {
      setSubmitting(false);
    }
  }

  const renderPropLabel = (p: Propriedade) => {
    const parts = [p.rua, p.numero, p.andar].filter(Boolean);
    return parts.length ? parts.join(", ") : `Propriedade ${p.id.slice(0, 6)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Morador
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Morador</DialogTitle>
          <DialogDescription>
            Preencha os dados. O morador receberá um email com a senha temporária.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleCreate}>
          {/* Nome / Email */}
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ana Silva"
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
              placeholder="ana.silva@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          {/* Telefone / BI */}
          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              placeholder="+351 912 345 678"
              value={form.telefone ?? ""}
              onChange={(e) => update("telefone", e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bi">BI (opcional)</Label>
            <Input
              id="bi"
              placeholder="12345678"
              value={form.bi ?? ""}
              onChange={(e) => update("bi", e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Foto: upload para user_fotos */}
          <div className="grid gap-2">
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
              value={form.foto ?? ""}
              onChange={(e) => update("foto", e.target.value)}
              placeholder="URL da foto (preenchido após upload)"
              disabled
              className="opacity-60"
            />
          </div>

          {/* Condomínio */}
          <div className="grid gap-2">
            <Label>Condomínio</Label>
            <Select
              value={condominioId}
              onValueChange={(val) => setCondominioId(val)}
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

          {/* Propriedade (apenas disponíveis no condomínio escolhido) */}
          <div className="grid gap-2">
            <Label>Casa/Propriedade</Label>
            <Select
              value={propriedadeId}
              onValueChange={(val) => setPropriedadeId(val)}
              disabled={submitting || loadingProps || !condominioId}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProps ? "Carregando..." : "Selecione uma propriedade"} />
              </SelectTrigger>
              <SelectContent>
                {propriedades.length > 0 ? (
                  propriedades.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome_propriedade || renderPropLabel(p)}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    {condominioId ? "Sem propriedades disponíveis" : "Selecione um condomínio"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !condominioId || !propriedadeId || fotoUploading}>
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
