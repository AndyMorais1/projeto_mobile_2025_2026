"use client";

import * as React from "react";
import { CreateCondominioDialog } from "@/components/myComponents/CreateCondominioDialog";
import {
  CondominioCard,
  Condominio,
  CondominioContato,
} from "@/components/myComponents/CondominioCard";
import { supabase } from "@/api/Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function CondominiosPage() {
  const [condominios, setCondominios] = React.useState<Condominio[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
        // filtra por nome do condomínio
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
        contatos: Array.isArray(c.contatos)
          ? (c.contatos as CondominioContato[])
          : [],
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
              onEdit={(item) => console.log("editar", item)}
              onDelete={(item) => console.log("apagar", item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
