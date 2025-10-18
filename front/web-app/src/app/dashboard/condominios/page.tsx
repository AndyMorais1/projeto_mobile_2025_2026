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

export default function CondominiosPage() {
  const [condominios, setCondominios] = React.useState<Condominio[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function fetchCondominios() {
    try {
      setLoading(true);

      // Busca diretamente da VIEW (totais + contactos)
      const { data, error } = await supabase
        .from("condominio_totais_contatos")
        .select("*")
        .order("created_at", { ascending: false });

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
      toast.error("Falha ao carregar condomínios");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchCondominios();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lista de condomínios</h1>
        <CreateCondominioDialog onCreated={fetchCondominios} />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">A carregar condomínios…</p>
      ) : !condominios.length ? (
        <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
          Nenhum condomínio encontrado.
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
