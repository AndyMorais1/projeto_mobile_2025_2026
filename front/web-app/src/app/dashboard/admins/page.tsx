"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // ✅ import adicionado
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Pencil, Trash2, RefreshCcw, Plus } from "lucide-react";
import { toast } from "sonner";

// 👉 importe o dialog que criámos
import { CreateAdminDialog } from "@/components/myComponents/CreateAdminDialog";

type EstadoUtilizador = "ativo" | "pendente" | "bloqueado";

type Admin = {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  estado_utilizador: EstadoUtilizador;
  is_super: boolean | null;
  created_at: string;
  updated_at: string;
};

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";
function fmtDateTime(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat(LOCALE, {
      dateStyle: "short",
      timeStyle: "short",
      hour12: false,
      timeZone: TIMEZONE,
    }).format(d);
  } catch {
    return s;
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = React.useState<Admin[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSuper, setIsSuper] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  // Busca
  const [q, setQ] = React.useState("");
  const [qDebounced, setQDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editData, setEditData] = React.useState<Pick<
    Admin,
    "id" | "nome" | "estado_utilizador"
  > | null>(null);
  const [saving, setSaving] = React.useState(false);

  const fetchMe = React.useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    setCurrentUserId(uid ?? null);

    if (!uid) {
      setIsSuper(false);
      return;
    }

    const { data, error } = await supabase
      .from("admin")
      .select("id,is_super")
      .eq("id", uid)
      .single();

    if (error) {
      setIsSuper(false);
      return;
    }
    setIsSuper(!!data?.is_super);
  }, []);

  const fetchAdmins = React.useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      let query = supabase
        .from("admin")
        .select(
          "id,nome,email,foto,estado_utilizador,is_super,created_at,updated_at"
        )
        .order("created_at", { ascending: false });

      if (qDebounced) {
        query = query.or(
          `nome.ilike.%${qDebounced}%,email.ilike.%${qDebounced}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setAdmins((data as Admin[]) ?? []);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message ?? "Erro ao carregar admins.");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [qDebounced]);

  React.useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  React.useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Realtime
  React.useEffect(() => {
    const channel = supabase
      .channel("admins-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin" },
        () => fetchAdmins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAdmins]);

  function handleOpenEdit(a: Admin) {
    setEditData({ id: a.id, nome: a.nome, estado_utilizador: a.estado_utilizador });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editData) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("admin")
        .update({
          nome: editData.nome,
          estado_utilizador: editData.estado_utilizador,
        })
        .eq("id", editData.id);
      if (error) throw error;
      toast.success("Admin atualizado com sucesso.");
      setEditOpen(false);
      setEditData(null);
      fetchAdmins();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao atualizar admin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a: Admin) {
    if (!isSuper || a.id === currentUserId) return;
    if (!confirm(`Apagar o admin "${a.nome}" (${a.email})?`)) return;
    try {
      const { error } = await supabase.from("admin").delete().eq("id", a.id);
      if (error) throw error;
      toast.success("Admin apagado.");
      setAdmins((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao apagar admin.");
    }
  }

  function handleRefresh() {
    fetchAdmins();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Tela de Admins</h1>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <Input
            placeholder="Buscar por nome ou email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:w-80"
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setQ("");
              setQDebounced("");
              fetchAdmins();
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Limpar
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>

          {/* ✅ Botão/Diálogo de criação de admin (apenas super) */}
          {isSuper ? (
            <CreateAdminDialog onCreated={() => fetchAdmins()} />
          ) : (
            <Button variant="default" disabled className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Admin
            </Button>
          )}
        </div>
      </div>

      {erro ? (
        <div className="rounded-xl border p-4 text-sm text-destructive">
          {erro}
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar admins…
          </CardContent>
        </Card>
      ) : admins.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
          Nenhum admin encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Super</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => {
                const isSelf = a.id === currentUserId;
                return (
                  <TableRow
                    key={a.id}
                    className={isSelf ? "opacity-60 pointer-events-none" : ""}
                  >
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell className="capitalize">{a.estado_utilizador}</TableCell>
                    <TableCell>{a.is_super ? "Sim" : "Não"}</TableCell>
                    <TableCell>{fmtDateTime(a.created_at)}</TableCell>
                    <TableCell>{fmtDateTime(a.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleOpenEdit(a)}
                          disabled={!isSuper || isSelf}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDelete(a)}
                          disabled={!isSuper || isSelf}
                        >
                          <Trash2 className="h-4 w-4" />
                          Apagar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar admin</DialogTitle>
            <DialogDescription>
              Atualize os dados do administrador selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={editData?.nome ?? ""}
                onChange={(e) =>
                  setEditData((prev) =>
                    prev ? { ...prev, nome: e.target.value } : prev
                  )
                }
                disabled={!isSuper}
              />
            </div>

            <div className="space-y-2">
              <Label>Estado do utilizador</Label>
              <Select
                value={editData?.estado_utilizador ?? "ativo"}
                onValueChange={(v) =>
                  setEditData((prev) =>
                    prev
                      ? {
                          ...prev,
                          estado_utilizador: v as EstadoUtilizador,
                        }
                      : prev
                  )
                }
                disabled={!isSuper}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!isSuper || saving || !editData?.nome?.trim()}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
