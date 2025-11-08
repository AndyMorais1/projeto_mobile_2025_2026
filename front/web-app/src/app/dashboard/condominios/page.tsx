"use client";

import * as React from "react";
import { CreateCondominioDialog } from "@/components/myComponents/CreateCondominioDialog";
import {
  CondominioCard,
  Condominio,
  CondominioContato,
} from "@/components/myComponents/CondominioCard";
import { EditCondominioDialog } from "@/components/myComponents/EditCondominioDialog";
import { supabase } from "@/api/Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CondominiosPage() {
  const [condominios, setCondominios] = React.useState<Condominio[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // diálogo de edição
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Condominio | null>(null);

  // diálogo de apagar
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<Condominio | null>(null);

  // 🔎 Busca por nome
  const [q, setQ] = React.useState("");
  const [qDebounced, setQDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  async function fetchCondominios() {
    try {
      setLoading(true);
      setErrorMsg(null);

      let query = supabase
        .from("condominio_totais_contatos")
        .select("*")
        .order("created_at", { ascending: false });

      if (qDebounced) {
        query = query.ilike("nome", `%${qDebounced}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const parsed = (data || []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        endereco: c.endereco,
        tipo_condominio: c.tipo_condominio,
        created_at: c.created_at,
        updated_at: c.updated_at,
        total_casas: Number(c.total_casas ?? 0),
        total_moradores: Number(c.total_moradores ?? 0),
        contatos: Array.isArray(c.contatos) ? (c.contatos as CondominioContato[]) : [],
      })) as Condominio[];

      setCondominios(parsed);
    } catch (err: any) {
      console.error(err);
      setCondominios([]);
      setErrorMsg(err?.message || "Falha ao carregar condomínios");
      toast.error("Falha ao carregar condomínios");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchCondominios();
  }, [qDebounced]);

  function handleRefresh() {
    fetchCondominios();
  }

  // abrir edição
  function onEdit(c: Condominio) {
    setEditing(c);
    setEditOpen(true);
  }

  // pedir confirmação de delete
  function onDelete(c: Condominio) {
    setDeleteItem(c);
    setConfirmOpen(true);
  }

  // regras de segurança do delete
  async function canDeleteCondominio(id: string): Promise<{ ok: boolean; reason?: string }> {
    // bloqueia se houver propriedades
    const { count, error } = await supabase
      .from("propriedade")
      .select("id", { count: "exact", head: true })
      .eq("condominio_id", id);
    if (error) return { ok: false, reason: error.message };
    if ((count ?? 0) > 0) {
      return { ok: false, reason: "Existem casas associadas a este condomínio. Remova-as ou mova-as antes de apagar." };
    }
    return { ok: true };
  }

  async function handleDeleteConfirm() {
    if (!deleteItem) return;
    try {
      setDeleting(true);

      const check = await canDeleteCondominio(deleteItem.id);
      if (!check.ok) {
        toast.error(check.reason || "Não é possível apagar este condomínio agora.");
        return;
      }

      // apaga contactos (se houver)
      const { error: delContactsErr } = await supabase
        .from("contato_condominio")
        .delete()
        .eq("condominio_id", deleteItem.id);
      if (delContactsErr) throw delContactsErr;

      // apaga condominio
      const { error: delCondoErr } = await supabase
        .from("condominio")
        .delete()
        .eq("id", deleteItem.id);
      if (delCondoErr) throw delCondoErr;

      toast.success("Condomínio apagado.");
      setCondominios(prev => prev.filter(c => c.id !== deleteItem.id));
      setConfirmOpen(false);
      setDeleteItem(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Falha ao apagar condomínio");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Lista de condomínios</h1>

        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            placeholder="Buscar por nome do condomínio..."
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
              fetchCondominios();
            }}
            title="Limpar busca"
          >
            <RefreshCcw className="h-4 w-4" />
            Limpar
          </Button>

          <CreateCondominioDialog onCreated={fetchCondominios} />
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

      {loading ? (
        <p className="text-muted-foreground text-2xl text-center items-center">A carregar condomínios…</p>
      ) : errorMsg ? (
        <div className="rounded-2xl border p-6 text-center text-sm text-destructive">
          {errorMsg}
        </div>
      ) : !condominios.length ? (
        <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
          {qDebounced
            ? "Nenhum condomínio encontrado para esta busca."
            : "Nenhum condomínio encontrado."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {condominios.map((c) => (
            <CondominioCard
              key={c.id}
              condominio={c}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Editar */}
      {editing && (
        <EditCondominioDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          condominio={{
            id: editing.id,
            nome: editing.nome,
            endereco: editing.endereco,
            tipo_condominio: editing.tipo_condominio as any,
            contatos: editing.contatos?.map((c) => ({
              id: c.id,
              telefone: c.telefone,
              entidade: c.entidade,
            })),
          }}
          onSaved={(upd) => {
            // Exclude contatos from the incoming update to keep Condominio.contatos type intact
            const { contatos: _contatos, ...safeUpd } = upd as any;
            setCondominios((prev) =>
              prev.map((row) =>
                row.id === editing.id
                  ? {
                      ...row,
                      ...safeUpd,
                      // mantém contagem/contatos (view será atualizada em refresh)
                    }
                  : row
              )
            );
            fetchCondominios(); // garante que agregados/contatos refletem view
          }}
        />
      )}

      {/* Confirmar apagar */}
      <AlertDialog open={confirmOpen} onOpenChange={(v) => !deleting && setConfirmOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar condomínio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Para evitar erros, só é permitido apagar um condomínio sem casas associadas. Os contactos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Apagando…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
