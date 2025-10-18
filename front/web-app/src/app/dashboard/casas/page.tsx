"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";
import { PropriedadeCard, type Propriedade, type PropriedadeRelations } from "@/components/myComponents/PropriedadeCard";
import { CreatePropriedadeDialog } from "@/components/myComponents/CreatePropriedadeDialog";

export default function HousesPage() {
  const { selected } = useCondominium();
  const [propriedades, setPropriedades] = React.useState<Propriedade[]>([]);
  const [relationsById, setRelationsById] = React.useState<Record<string, PropriedadeRelations>>({});
  const [carregar, setCarregar] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const carregarPropriedades = React.useCallback(async () => {
    if (!selected) {
      setPropriedades([]);
      setRelationsById({});
      setCarregar(false);
      return;
    }

    setCarregar(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from("propriedade")
        .select(`
          id,
          condominio_id,
          morador_id,
          tipo_propriedade,
          estado_propriedade,
          rua,
          numero,
          andar,
          tem_estacionamento,
          created_at,
          updated_at,
          morador:morador_id ( id, nome ),
          condominio:condominio_id ( id, nome )
        `)
        .eq("condominio_id", selected.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list: Propriedade[] = (data ?? []).map((p: any) => ({
        id: p.id,
        condominio_id: p.condominio_id,
        morador_id: p.morador_id,
        tipo_propriedade: p.tipo_propriedade,
        estado_propriedade: p.estado_propriedade,
        rua: p.rua,
        numero: p.numero,
        andar: p.andar,
        tem_estacionamento: p.tem_estacionamento,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      const rel: Record<string, PropriedadeRelations> = {};
      (data ?? []).forEach((p: any) => {
        rel[p.id] = {
          condominio_nome: p?.condominio?.nome ?? selected.nome ?? null,
          morador_nome: p?.morador?.nome ?? null,
        };
      });

      setPropriedades(list);
      setRelationsById(rel);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar propriedades.");
      setPropriedades([]);
      setRelationsById({});
    } finally {
      setCarregar(false);
    }
  }, [selected]);

  React.useEffect(() => {
    carregarPropriedades();
  }, [carregarPropriedades]);

  React.useEffect(() => {
    if (!selected) return;

    const channel = supabase
      .channel("propriedades-por-condominio")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "propriedade", filter: `condominio_id=eq.${selected.id}` },
        () => carregarPropriedades()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, carregarPropriedades]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {selected ? `Propriedades — ${selected.nome}` : "Propriedades"}
        </h2>

        <CreatePropriedadeDialog
          presetCondominioId={selected?.id}
          onCreated={() => carregarPropriedades()}
        />
      </div>

      {erro ? (
        <div className="rounded-xl border p-4 text-sm text-destructive">
          Erro a carregar: {erro}
        </div>
      ) : null}

      {!carregar && propriedades.length === 0 ? (
        <h1 className="text-center text-muted-foreground">
          {selected
            ? "Nenhuma propriedade neste condomínio."
            : "Selecione um condomínio acima para ver as propriedades."}
        </h1>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {carregar
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border bg-muted/30" />
            ))
          : propriedades.map((p) => (
              <PropriedadeCard
                key={p.id}
                propriedade={p}
                relations={relationsById[p.id]}
                onEdit={() => {/* TODO: abrir dialog de edição */}}
                onDelete={() => {/* TODO: confirmação e delete */}}
                onPassarFatura={() => {/* TODO: abrir dialog de faturação */}}
              />
            ))}
      </div>
    </div>
  );
}
