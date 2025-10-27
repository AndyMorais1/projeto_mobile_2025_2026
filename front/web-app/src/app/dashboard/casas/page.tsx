"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";
import {
  PropriedadeCard,
  type Propriedade,
  type PropriedadeRelations,
} from "@/components/myComponents/PropriedadeCard";
import { CreatePropriedadeDialog } from "@/components/myComponents/CreatePropriedadeDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function HousesPage() {
  const { selected } = useCondominium();
  const [propriedades, setPropriedades] = React.useState<Propriedade[]>([]);
  const [relationsById, setRelationsById] = React.useState<
    Record<string, PropriedadeRelations>
  >({});
  const [carregar, setCarregar] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  // 🔎 Busca (morador.nome, morador.email, tipo_propriedade, nome_propriedade)
  const [busca, setBusca] = React.useState("");
  const [buscaDebounced, setBuscaDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca.trim()), 400);
    return () => clearTimeout(t);
  }, [busca]);

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
      // Base da query
      let query = supabase
        .from("propriedade")
        .select(
          `
          id,
          condominio_id,
          morador_id,
          tipo_propriedade,
          estado_propriedade,
          rua,
          numero,
          andar,
          nome_propriedade,
          tem_estacionamento,
          created_at,
          updated_at,
          morador:morador_id ( id, nome, email ),
          condominio:condominio_id ( id, nome )
        `
        )
        .eq("condominio_id", selected.id)
        .order("created_at", { ascending: false });

      // Filtro de busca (morador.nome, morador.email, tipo_propriedade, nome_propriedade)
      if (buscaDebounced) {
        // PostgREST permite filtrar por colunas de relações usando o alias do select
        query = query.or(
          [
            `morador.nome.ilike.%${buscaDebounced}%`,
            `morador.email.ilike.%${buscaDebounced}%`,
            `tipo_propriedade.ilike.%${buscaDebounced}%`,
            `nome_propriedade.ilike.%${buscaDebounced}%`,
          ].join(",")
        );
      }

      const { data, error } = await query;
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
        nome_propriedade: p.nome_propriedade ?? null,
        tem_estacionamento: p.tem_estacionamento,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      const rel: Record<string, PropriedadeRelations> = {};
      (data ?? []).forEach((p: any) => {
        rel[p.id] = {
          condominio_nome: p?.condominio?.nome ?? selected.nome ?? null,
          morador_nome: p?.morador?.nome ?? null,
          // se o teu PropriedadeRelations tiver email, podes adicionar:
          morador_email: p?.morador?.email ?? null,
        } as PropriedadeRelations;
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
  }, [selected, buscaDebounced]);

  React.useEffect(() => {
    carregarPropriedades();
  }, [carregarPropriedades]);

  React.useEffect(() => {
    if (!selected) return;

    const channel = supabase
      .channel("propriedades-por-condominio")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "propriedade",
          filter: `condominio_id=eq.${selected.id}`,
        },
        () => carregarPropriedades()
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, carregarPropriedades]);

  const handleRefresh = () => {
    carregarPropriedades();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          {selected ? `Propriedades — ${selected.nome}` : "Propriedades"}
        </h2>

        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            placeholder="Buscar por morador (nome/email), tipo ou nome da propriedade…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="sm:w-[34rem]"
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setBusca("");
              setBuscaDebounced("");
              carregarPropriedades();
            }}
            title="Limpar busca"
          >
            <RefreshCcw className="h-4 w-4" />
            Limpar
          </Button>

          <CreatePropriedadeDialog
            presetCondominioId={selected?.id}
            onCreated={() => carregarPropriedades()}
          />
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

      {erro ? (
        <div className="rounded-xl border p-4 text-sm text-destructive">
          Erro a carregar: {erro}
        </div>
      ) : null}

      {!carregar && propriedades.length === 0 ? (
        <h1 className="text-center text-muted-foreground">
          {selected
            ? "Nenhuma propriedade encontrada."
            : "Selecione um condomínio acima para ver as propriedades."}
        </h1>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {carregar
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border bg-muted/30"
              />
            ))
          : propriedades.map((p) => (
              <PropriedadeCard
                key={p.id}
                propriedade={p}
                relations={relationsById[p.id]}
                onEdit={() => {
                  /* TODO */
                }}
                onDelete={() => {
                  /* TODO */
                }}
                onPassarFatura={() => {
                  /* TODO */
                }}
              />
            ))}
      </div>
    </div>
  );
}
