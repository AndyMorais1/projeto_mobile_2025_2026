// components/myComponents/CasaCard.tsx
"use client";
import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/api/Client";
import { downloadFromUrl } from "@/lib/download";

import { CreateFaturaDialog } from "@/components/myComponents/CreateFaturaDialog";
import { EditCasaDialog } from "@/components/myComponents/EditCasaDialog";
import { EditFaturaDialog } from "@/components/myComponents/EditFaturaDialog";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Home,
  MapPin,
  Car,
  Layers,
  CalendarClock,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  User,
  Mail,
  Phone,
  IdCard,
  ReceiptText,
  ExternalLink,
  Download,
  Loader2,
  EllipsisVertical,
} from "lucide-react";

// ======================= Tipos =======================
export type Propriedade = {
  id: string;
  condominio_id: string | null;
  morador_id?: string | null;
  tipo_propriedade: string;
  estado_propriedade: string;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  rua?: string | null;
  numero?: string | null;
  andar?: string | null;
  tem_estacionamento?: boolean | null;
  nome_propriedade?: string | null;
};

export type PropriedadeRelations = {
  condominio_nome?: string | null;
  morador_nome?: string | null;
  morador_email?: string | null;
};

type Morador = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  bi?: string | null;
  estado_utilizador: string;
  foto?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

type Fatura = {
  id: string;
  titulo: string;
  valor: number;
  estado_fatura: "pago" | "pendente" | "cancelado" | string;
  tipo_fatura: "agua" | "luz" | "taxa" | "outro" | string;
  moeda: string;
  descricao?: string | null;
  recibo_url?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  // no SELECT padrão não vem propriedade_id; ao editar/apagar passamos manualmente
};

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";
const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

// ======================= Utils =======================
function fmtDateTime(input?: string | Date | null) {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(d);
}

function fullAddress(p: Propriedade) {
  const parts = [
    p.rua,
    p.numero && `nº ${p.numero}`,
    p.andar && `andar ${p.andar}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function toneEstado(estado: string) {
  const s = (estado || "").toLowerCase();
  if (s === "ativa" || s === "ativo" || s === "disponivel")
    return "border-green-200 bg-green-50 text-green-700";
  if (s === "pendente" || s === "manutencao")
    return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (s === "inativa" || s === "inativo" || s === "ocupada")
    return "border-gray-200 bg-gray-50 text-gray-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function safeName(s: string) {
  return s.replace(/[^\w\-\.]+/g, "_");
}

async function handleDownloadRecibo(f: Fatura) {
  if (!f.recibo_url) return;
  const filename = `${safeName(f.titulo || `recibo-${f.id}`)}.pdf`;
  try {
    await downloadFromUrl(f.recibo_url, filename);
  } catch (e: any) {
    // fallback: se for hosted receipt do Stripe (HTML/CORS), abre em nova aba
    window.open(f.recibo_url, "_blank", "noopener");
  }
}

function toneTipo(tipo: string) {
  const s = (tipo || "").toLowerCase();
  if (s.includes("vivenda")) return "border-blue-200 bg-blue-50 text-blue-700";
  if (s.includes("apartamento"))
    return "border-purple-200 bg-purple-50 text-purple-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function toneFatura(estado: Fatura["estado_fatura"]) {
  switch ((estado || "").toLowerCase()) {
    case "pago":
      return "border-green-200 bg-green-50 text-green-700";
    case "pendente":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
    case "cancelado":
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function toneFaturaTipo(tipo: Fatura["tipo_fatura"]) {
  switch ((tipo || "").toLowerCase()) {
    case "agua":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "luz":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
    case "taxa":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "outro":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function getInitials(name?: string) {
  if (!name) return "?";
  const [a = "", b = ""] = name.trim().split(/\s+/);
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}

// ======================= Componente =======================
export function CasaCard({
  propriedade,
  relations,
}: {
  propriedade: Propriedade;
  relations?: PropriedadeRelations;
}) {
  const [open, setOpen] = React.useState(false);
  const [openMorador, setOpenMorador] = React.useState(false);
  const [openCreateFatura, setOpenCreateFatura] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [morador, setMorador] = React.useState<Morador | null>(null);
  const [loadingMorador, setLoadingMorador] = React.useState(false);
  const [erroMorador, setErroMorador] = React.useState<string | null>(null);

  const [faturas, setFaturas] = React.useState<Fatura[] | null>(null);
  const [loadingFaturas, setLoadingFaturas] = React.useState(false);
  const [erroFaturas, setErroFaturas] = React.useState<string | null>(null);

  // ===== edição/remoção de faturas =====
  const [editFaturaOpen, setEditFaturaOpen] = React.useState(false);
  const [editingFatura, setEditingFatura] = React.useState<
    (Fatura & { propriedade_id: string }) | null
  >(null);

  const [confirmFaturaOpen, setConfirmFaturaOpen] = React.useState(false);
  const [deletingFatura, setDeletingFatura] = React.useState(false);
  const [faturaToDelete, setFaturaToDelete] = React.useState<
    (Fatura & { propriedade_id: string }) | null
  >(null);

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const loadFaturas = React.useCallback(async () => {
    try {
      setLoadingFaturas(true);
      setErroFaturas(null);
      const { data, error } = await supabase
        .from("fatura")
        .select(
          "id, titulo, valor, estado_fatura, tipo_fatura, moeda, descricao, recibo_url, created_at, updated_at"
        )
        .eq("propriedade_id", propriedade.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFaturas((data as Fatura[]) ?? []);
    } catch (e: any) {
      setErroFaturas(e?.message || "Falha ao carregar faturas");
      setFaturas([]);
    } finally {
      setLoadingFaturas(false);
    }
  }, [propriedade.id]);

  React.useEffect(() => {
    if (open) void loadFaturas();
  }, [open, loadFaturas]);

  const handleOpenMorador: React.MouseEventHandler<HTMLButtonElement> = async (
    e
  ) => {
    stop(e);
    setOpenMorador(true);
    if (!propriedade.morador_id) {
      setMorador(null);
      setErroMorador(null);
      return;
    }
    try {
      setLoadingMorador(true);
      setErroMorador(null);
      const { data, error } = await supabase
        .from("morador")
        .select(
          "id, nome, email, telefone, bi, estado_utilizador, foto, created_at, updated_at"
        )
        .eq("id", propriedade.morador_id)
        .single();
      if (error) throw error;
      setMorador(data as Morador);
    } catch (err: any) {
      setErroMorador(err?.message || "Falha ao carregar dados do morador.");
      setMorador(null);
    } finally {
      setLoadingMorador(false);
    }
  };

  function handlePassarFaturaClick(e: React.MouseEvent<HTMLButtonElement>) {
    stop(e);
    setOpenCreateFatura(true);
  }

  async function handlePagarFatura(faturaId: string) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
        ".supabase.co",
        ".functions.supabase.co"
      )}/create_checkout_session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fatura_id: faturaId }),
      }
    );
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast.error(data.error || "Falha ao criar sessão de pagamento");
  }

  async function canDeletePropriedade(): Promise<{
    ok: boolean;
    reason?: string;
  }> {
    if (propriedade.morador_id) {
      return {
        ok: false,
        reason:
          "Esta casa tem um morador associado. Libere a propriedade primeiro.",
      };
    }
    const { count, error } = await supabase
      .from("fatura")
      .select("id", { count: "exact", head: true })
      .eq("propriedade_id", propriedade.id);
    if (error) return { ok: false, reason: error.message };
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        reason:
          "Existem faturas associadas a esta casa. Arquive-as/remova-as antes de apagar.",
      };
    }
    return { ok: true };
  }

  // helper (client-side)
  function safeName(s: string) {
    return s.replace(/[^\w\-\.]+/g, "_");
  }

  function getFunctionsBase() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
      ".supabase.co",
      ".functions.supabase.co"
    );
  }

  async function handleDownloadRecibo(f: Fatura) {
    if (!f.recibo_url) return;

    // chama a Function passando o Bearer token
    const url = `${getFunctionsBase()}/download_receipt?fatura_id=${encodeURIComponent(
      f.id
    )}`;

    // tenta usar o access_token do user; se não houver (ex.: sem login), usa o ANON KEY
    const { data: sess } = await supabase.auth.getSession();
    const bearer =
      sess.session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const resp = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${bearer}` },
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => "");
      throw new Error(`Falha no download (${resp.status}) ${msg}`);
    }

    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeName(f.titulo || `recibo-${f.id}`)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function handleDeleteConfirm() {
    try {
      setDeleteError(null);
      setDeleting(true);
      const check = await canDeletePropriedade();
      if (!check.ok)
        throw new Error(
          check.reason || "Não é possível apagar esta casa agora."
        );
      const { error } = await supabase
        .from("propriedade")
        .delete()
        .eq("id", propriedade.id);
      if (error) throw new Error(error.message);
      setConfirmOpen(false);
      toast.success("Propriedade apagada.");
      // HousesPage (via Realtime) atualiza a lista
    } catch (e: any) {
      setDeleteError(e?.message || "Erro ao apagar propriedade.");
      toast.error(e?.message || "Erro ao apagar propriedade.");
    } finally {
      setDeleting(false);
    }
  }

  // ====== editar/apagar fatura (UI handlers) ======
  function askEditFatura(f: Fatura) {
    setEditingFatura({ ...f, propriedade_id: propriedade.id });
    setEditFaturaOpen(true);
  }

  function askDeleteFatura(f: Fatura) {
    setFaturaToDelete({ ...f, propriedade_id: propriedade.id });
    setConfirmFaturaOpen(true);
  }

  async function handleDeleteFaturaConfirm() {
    if (!faturaToDelete) return;
    try {
      setDeletingFatura(true);
      const { error } = await supabase
        .from("fatura")
        .delete()
        .eq("id", faturaToDelete.id);
      if (error) throw new Error(error.message);

      // otimista + recarrega para garantir consistência de ordenação
      setFaturas((curr) =>
        curr ? curr.filter((x) => x.id !== faturaToDelete.id) : curr
      );
      toast.success("Fatura apagada.");
      setConfirmFaturaOpen(false);
      setFaturaToDelete(null);
      void loadFaturas();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao apagar fatura.");
    } finally {
      setDeletingFatura(false);
    }
  }

  return (
    <>
      {/* Dialogs auxiliares */}
      <CreateFaturaDialog
        open={openCreateFatura}
        onOpenChange={setOpenCreateFatura}
        propriedadeId={propriedade.id}
        onCreated={() => {
          if (open) void loadFaturas();
        }}
      />

      <EditCasaDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        propriedade={propriedade}
      />

      {editingFatura && (
        <EditFaturaDialog
          open={editFaturaOpen}
          onOpenChange={setEditFaturaOpen}
          fatura={editingFatura}
          onSaved={(upd) => {
            setFaturas((curr) =>
              curr
                ? curr.map((x) =>
                    x.id === editingFatura.id ? ({ ...x, ...upd } as Fatura) : x
                  )
                : curr
            );
            void loadFaturas();
          }}
        />
      )}

      {/* Card resumido */}
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex h-full w-full flex-col",
          "rounded-2xl border border-muted/40 shadow-sm transition-all",
          "hover:shadow-lg hover:border-muted focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <CardHeader
          className={cn(
            "relative flex items-start justify-between gap-4",
            "rounded-t-2xl p-5 w-full"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl ring-2 bg-gray-100 ring-background shadow">
              <Home className="size-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-xl font-semibold leading-tight">
                {relations?.condominio_nome || "Propriedade"}
              </CardTitle>
              <div className="min-w-0 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex min-w-0 items-center gap-1 truncate">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{fullAddress(propriedade)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-start gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-xl",
                toneEstado(propriedade.estado_propriedade)
              )}
            >
              {propriedade.estado_propriedade}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={stop}
                >
                  <MoreVertical className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44" onClick={stop}>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" /> Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border p-3">
              <Layers className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                Tipo:
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2 rounded-xl",
                    toneTipo(propriedade.tipo_propriedade)
                  )}
                >
                  {propriedade.tipo_propriedade}
                </Badge>
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border p-3">
              <User className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                Morador:{" "}
                {relations?.morador_nome ||
                  (propriedade.morador_id ? "—" : "—")}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border p-3">
              <Building2 className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                Condomínio: {relations?.condominio_nome || "—"}
              </span>
            </div>

            {propriedade.tipo_propriedade?.toLowerCase() === "apartamento" && (
              <div className="flex items-center gap-2 rounded-xl border p-3">
                <Car className="size-4 shrink-0" />
                <span className="min-w-0 truncate">
                  Estacionamento:{" "}
                  {propriedade.tem_estacionamento ? "Sim" : "Não"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-4" /> Criado
              </div>
              <span className="font-medium">
                {fmtDateTime(propriedade.created_at)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-4" /> Atualizado
              </div>
              <span className="font-medium">
                {fmtDateTime(propriedade.updated_at)}
              </span>
            </div>
          </div>

          {/* Footer: Passar fatura + Ver morador */}
          <div className="mt-auto pt-5 flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={handlePassarFaturaClick}
              title="Passar fatura"
            >
              <ReceiptText className="mr-2 size-4" /> Passar fatura
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={handleOpenMorador}
              disabled={!propriedade.morador_id}
              title={
                propriedade.morador_id ? "Ver morador" : "Sem morador associado"
              }
            >
              <User className="mr-2 size-4" /> Ver morador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===================== DIALOG DETALHES ===================== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl">
                <Home className="size-5" />
              </div>
              <span>{relations?.condominio_nome || "Propriedade"}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Mais informações da propriedade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" /> Morada
                </div>
                <div className="font-medium break-words">
                  {fullAddress(propriedade)}
                </div>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <Layers className="size-4" /> Tipo
                </div>
                <div className="font-medium">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-xl",
                      toneTipo(propriedade.tipo_propriedade)
                    )}
                  >
                    {propriedade.tipo_propriedade}
                  </Badge>
                </div>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4" /> Condomínio
                </div>
                <div className="font-medium">
                  {relations?.condominio_nome ||
                    propriedade.condominio_id ||
                    "—"}
                </div>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" /> Morador
                </div>
                <div className="font-medium">
                  {relations?.morador_nome || propriedade.morador_id || "—"}
                </div>
              </div>
            </div>

            {/* Lista de Faturas */}
            <div className="rounded-2xl border">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ReceiptText className="size-4" /> Faturas
                </div>
                {Array.isArray(faturas) && faturas.length > 0 ? (
                  <Badge variant="outline" className="rounded-xl">
                    {faturas.length}
                  </Badge>
                ) : null}
              </div>
              <Separator />

              {loadingFaturas ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  A carregar…
                </div>
              ) : erroFaturas ? (
                <div className="px-4 py-6 text-sm text-destructive">
                  {erroFaturas}
                </div>
              ) : !faturas || faturas.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  Sem faturas para esta propriedade.
                </div>
              ) : (
                <div className="max-h-64 overflow-auto">
                  <ul className="divide-y">
                    {faturas.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate">
                              {f.titulo}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-xl",
                                toneFaturaTipo(f.tipo_fatura)
                              )}
                            >
                              {f.tipo_fatura}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-xl",
                                toneFatura(f.estado_fatura)
                              )}
                            >
                              {f.estado_fatura}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {f.created_at
                              ? new Date(f.created_at).toLocaleDateString(
                                  "pt-PT"
                                )
                              : "—"}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold">
                            {f.moeda?.toUpperCase() === "EUR"
                              ? eur.format(f.valor)
                              : `${f.valor} ${f.moeda || ""}`}
                          </div>

                          {f.recibo_url ? (
                            <div className="flex items-center gap-2">
                              {/* Abrir no Stripe/URL direto */}
                              <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="size-8"
                                title="Abrir PDF"
                              >
                                <a
                                  href={f.recibo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-4" />
                                </a>
                              </Button>

                              {/* Download via proxy local (força attachment + nome bonitinho) */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                title="Transferir PDF"
                                onClick={() => handleDownloadRecibo(f)}
                              >
                                <Download className="size-4" />
                              </Button>
                            </div>
                          ) : null}

                          {f.estado_fatura?.toLowerCase() === "pendente" && (
                            <>
                              <Button
                                onClick={() => handlePagarFatura(f.id)}
                                className="rounded-xl"
                                variant="default"
                              >
                                Pagar
                              </Button>
                              {/* Menu: Editar/Apagar fatura */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="rounded-xl"
                                    title="Mais ações"
                                  >
                                    <EllipsisVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40"
                                >
                                  <DropdownMenuItem
                                    onClick={() => askEditFatura(f)}
                                  >
                                    <Pencil className="mr-2 size-4" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => askDeleteFatura(f)}
                                  >
                                    <Trash2 className="mr-2 size-4" /> Apagar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={(e) => {
                e.preventDefault();
                setOpenCreateFatura(true);
              }}
            >
              <ReceiptText className="mr-2 size-4" /> Passar fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL MORADOR ===================== */}
      <Dialog open={openMorador} onOpenChange={setOpenMorador}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="size-10 rounded-xl">
                {morador?.foto ? (
                  <AvatarImage src={morador.foto} alt={morador.nome} />
                ) : (
                  <AvatarFallback>
                    {getInitials(
                      morador?.nome || relations?.morador_nome || ""
                    )}
                  </AvatarFallback>
                )}
              </Avatar>
              <span>
                {morador?.nome || relations?.morador_nome || "Morador"}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Informações do morador
            </DialogDescription>
          </DialogHeader>

          {!propriedade.morador_id ? (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              Esta propriedade não tem um morador associado.
            </div>
          ) : loadingMorador ? (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              A carregar…
            </div>
          ) : erroMorador ? (
            <div className="rounded-xl border p-4 text-sm text-destructive">
              {erroMorador}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4" /> Email
                  </div>
                  <a
                    className="font-medium break-words"
                    href={
                      morador?.email ? `mailto:${morador.email}` : undefined
                    }
                  >
                    {morador?.email || "—"}
                  </a>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4" /> Telefone
                  </div>
                  <a
                    className="font-medium"
                    href={
                      morador?.telefone ? `tel:${morador.telefone}` : undefined
                    }
                  >
                    {morador?.telefone || "—"}
                  </a>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                    <IdCard className="size-4" /> BI
                  </div>
                  <div className="font-medium">{morador?.bi || "—"}</div>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                    <User className="size-4" /> Estado
                  </div>
                  <Badge variant="outline" className="rounded-xl">
                    {morador?.estado_utilizador || "—"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="size-4" /> Criado
                  </div>
                  <span className="font-medium">
                    {fmtDateTime(morador?.created_at)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="size-4" /> Atualizado
                  </div>
                  <span className="font-medium">
                    {fmtDateTime(morador?.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== CONFIRMAR APAGAR CASA ===================== */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar casa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a propriedade de forma definitiva. Se existirem
              faturas ou um morador associado, a operação será bloqueada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="px-1 text-sm text-red-600">{deleteError}</div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Apagando...
                </span>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===================== CONFIRMAR APAGAR FATURA ===================== */}
      <AlertDialog
        open={confirmFaturaOpen}
        onOpenChange={(v) => !deletingFatura && setConfirmFaturaOpen(v)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar fatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. A fatura "{faturaToDelete?.titulo}" será
              removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingFatura}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFaturaConfirm}
              disabled={deletingFatura}
            >
              {deletingFatura ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Apagando…
                </span>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
