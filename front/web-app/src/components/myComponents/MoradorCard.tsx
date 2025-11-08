"use client";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Pencil,
  Trash2,
  Mail,
  Phone,
  IdCard,
  CalendarClock,
  MoreVertical,
  Building2,
  Home,
  Loader2,
} from "lucide-react";
import { EditMoradorDialog } from "@/components/myComponents/ EditMoradorDialog";
import { supabase } from "@/api/Client";

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";

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

export interface Morador {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  bi?: string | null;
  estado_utilizador: string;
  foto?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  propriedade?: string | null; // nome_propriedade
  condominio?: string | null; // nome do condomínio
}

function getInitials(name?: string) {
  if (!name) return "?";
  const [a = "", b = ""
  ] = name.trim().split(/\s+/);
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}

function tone(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "ativo")
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300";
  if (s === "inativo")
    return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300";
  if (s === "pendente")
    return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-300";
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300";
}

function getFunctionsBaseUrl() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return projectUrl.replace(".supabase.co", ".functions.supabase.co");
}

export function MoradorCard({
  morador,
  onUpdated,
  onDeleted,
}: {
  morador: Morador;
  onUpdated?: (m: Partial<Morador> & { id: string }) => void;
  onDeleted?: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stop: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  async function handleDelete() {
    try {
      setError(null);
      setDeleting(true);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData?.session) throw new Error("Sessão inválida. Faça login novamente.");
      const jwt = sessionData.session.access_token;
      const functionsBase = getFunctionsBaseUrl();
      const res = await fetch(`${functionsBase}/admin_delete_morador`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: morador.id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "Falha ao apagar morador.");
      }
      toast.success("Morador apagado com sucesso.", { duration: 3000 });
      onDeleted?.(morador.id);
      setConfirmOpen(false);
    } catch (err: any) {
      setError(err?.message || "Erro ao apagar morador.");
      toast.error(err?.message || "Erro ao apagar morador.", { duration: 3000 });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card
      className={cn(
        "group relative rounded-2xl border shadow-sm transition-all",
        "bg-white/90 supports-[backdrop-filter]:bg-white/60 backdrop-blur dark:bg-neutral-950/50",
        "border-neutral-200 shadow-black/5 hover:shadow-lg hover:border-neutral-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2",
        "hover:-translate-y-0.5"
      )}
    >
      <CardHeader className="relative flex items-start justify-between gap-4 rounded-t-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-14 rounded-full ring-2 ring-white dark:ring-neutral-900 shadow-sm">
              {morador.foto ? (
                <AvatarImage src={morador.foto} alt={morador.nome} />
              ) : (
                <AvatarFallback className="text-base">
                  {getInitials(morador.nome)}
                </AvatarFallback>
              )}
            </Avatar>
            {morador.estado_utilizador?.toLowerCase() === "ativo" ? (
              <span className="absolute -right-1 -bottom-1 inline-flex size-3 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400/60" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
            ) : null}
          </div>

          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold leading-tight tracking-tight">
              {morador.nome}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <a
                href={`mailto:${morador.email}`}
                className="hover:underline inline-flex items-center gap-1"
                onClick={stop}
              >
                <Mail className="size-3.5" /> {morador.email}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-xl border px-4 mx-2 py-1 text-xs",
              tone(morador.estado_utilizador)
            )}
            onClick={stop}
          >
            {morador.estado_utilizador}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-xl"
                onClick={stop}
                aria-label="Mais ações"
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

      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3">
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              {morador.telefone || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {morador.condominio || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3">
            <Home className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {morador.propriedade || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3">
            <IdCard className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {morador.bi || "—"}
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between bg-muted/30 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" /> Criado
            </div>
            <span className="font-medium">{fmtDateTime(morador.created_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" /> Atualizado
            </div>
            <span className="font-medium">{fmtDateTime(morador.updated_at)}</span>
          </div>
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          )}
        </div>
      </CardContent>

      {/* Edit */}
      <EditMoradorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        morador={morador}
        onUpdated={(m) => {
          onUpdated?.(m);
          setEditOpen(false);
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar morador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai remover o utilizador da tabela <b>morador</b> e da
              <b> Auth</b>. Todas as propriedades associadas serão libertadas.
              Esta operação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
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
    </Card>
  );
}