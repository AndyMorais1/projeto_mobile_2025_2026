"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";
import { InfoCard, type Info } from "@/components/myComponents/InfoCard";
import { Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { CreateInfoDialog } from "@/components/myComponents/CreateInfoDialog";
import { EditInfoDialog } from "@/components/myComponents/EditInfoDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function InfoPage() {
  const { selected } = useCondominium();

  const [infos, setInfos] = React.useState<Info[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // EDIT dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Info | null>(null);

  // DELETE dialog
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<Info | null>(null);

  // 🔎 Busca por título
  const [q, setQ] = React.useState("");
  const [qDebounced, setQDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const fetchInfos = React.useCallback(async () => {
    if (!selected?.id) {
      setInfos([]);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from("info")
      .select("*")
      .eq("condominio_id", selected.id)
      .order("created_at", { ascending: false });

    if (qDebounced) {
      query = query.ilike("titulo", `%${qDebounced}%`);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setInfos([]);
    } else {
      setInfos((data as Info[]) ?? []);
    }
    setLoading(false);
  }, [selected?.id, qDebounced]);

  // Fetch inicial + mudanças
  React.useEffect(() => {
    fetchInfos();
  }, [fetchInfos]);

  // Realtime
  React.useEffect(() => {
    if (!selected?.id) return;

    const channel = supabase
      .channel(`info-realtime-${selected.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "info",
          filter: `condominio_id=eq.${selected.id}`,
        },
        (payload) => {
          if (qDebounced) {
            // com filtro, mantém consistência refazendo busca
            fetchInfos();
            return;
          }
          switch (payload.eventType) {
            case "INSERT": {
              const row = payload.new as Info;
              setInfos((curr) => (curr.some((i) => i.id === row.id) ? curr : [row, ...curr]));
              break;
            }
            case "UPDATE": {
              const row = payload.new as Info;
              setInfos((curr) => {
                const next = curr.map((i) => (i.id === row.id ? row : i));
                next.sort(
                  (a, b) => +new Date(b.created_at as any) - +new Date(a.created_at as any)
                );
                return next;
              });
              break;
            }
            case "DELETE": {
              const row = payload.old as Info;
              setInfos((curr) => curr.filter((i) => i.id !== row.id));
              break;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected?.id, qDebounced, fetchInfos]);

  // Handlers
  function handleEdit(info: Info) {
    setEditing(info);
    setEditOpen(true);
  }

  function askDelete(info: Info) {
    setDeleteItem(info);
    setConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteItem) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("info").delete().eq("id", deleteItem.id);
      if (error) throw new Error(error.message);

      // otimista (realtime também remove)
      setInfos((curr) => curr.filter((i) => i.id !== deleteItem.id));
      toast.success("Informação apagada.");
      setConfirmOpen(false);
      setDeleteItem(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao apagar informação.");
    } finally {
      setDeleting(false);
    }
  }

  function handleRefresh() {
    fetchInfos();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          {selected ? `Informações — ${selected.nome}` : "Informações"}
        </h2>

        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            placeholder="Buscar por título..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:w-80"
          />
          <Button
            variant="outline"
            onClick={() => {
              setQ("");
              setQDebounced("");
              fetchInfos();
            }}
            className="gap-2"
            title="Limpar busca"
          >
            <RefreshCcw className="h-4 w-4" />
            Limpar
          </Button>

          <CreateInfoDialog />
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
            title="Atualizar lista"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estados */}
      {!selected ? (
        <p className="text-center text-muted-foreground">
          Selecione um condomínio para ver as informações.
        </p>
      ) : loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar informações…
        </div>
      ) : error ? (
        <div className="text-center text-destructive">{error}</div>
      ) : infos.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Nenhuma informação encontrada {qDebounced ? "para esta busca." : "para este condomínio."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {infos.map((info) => (
            <InfoCard
              key={info.id}
              info={info}
              onEdit={handleEdit}
              onDelete={askDelete}
            />
          ))}
        </div>
      )}

      {/* Editar */}
      {editing && (
        <EditInfoDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          info={editing}
          onSaved={(upd) => {
            // atualiza localmente + faz um refresh para garantir coerência
            setInfos((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...upd } as Info : i)));
            fetchInfos();
          }}
        />
      )}

      {/* Confirmar apagar */}
      <AlertDialog open={confirmOpen} onOpenChange={(v) => !deleting && setConfirmOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar informação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. A informação "{deleteItem?.titulo}" será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Apagando…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Confirmar
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
