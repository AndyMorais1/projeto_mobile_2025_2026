"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";
import {
  CasaCard,
  type Propriedade,
  type PropriedadeRelations,
} from "@/components/myComponents/CasaCard";
import { CreateCasaDialog } from "@/components/myComponents/CreateCasaDialog";
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

  // ---- helpers ----
  const rowToPropriedade = React.useCallback((p: any): Propriedade => {
    return {
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
    };
  }, []);

  const fetchRelationsFor = React.useCallback(
    async (id: string): Promise<PropriedadeRelations> => {
      const { data, error } = await supabase
        .from("propriedade")
        .select(
          `id,
           morador:morador_id (nome, email),
           condominio:condominio_id (nome)`
        )
        .eq("id", id)
        .single();

      if (error || !data) return {};

      const getNome = (rel: any) =>
        Array.isArray(rel) ? rel[0]?.nome ?? null : rel?.nome ?? null;

      const getEmail = (rel: any) =>
        Array.isArray(rel) ? rel[0]?.email ?? null : rel?.email ?? null;

      return {
        condominio_nome: getNome(data?.condominio),
        morador_nome: getNome(data?.morador),
        morador_email: getEmail(data?.morador),
      };
    },
    []
  );
  // ---- fetch inicial/refresh ----
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

      if (buscaDebounced) {
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

      const list: Propriedade[] = (data ?? []).map(rowToPropriedade);
      const rel: Record<string, PropriedadeRelations> = {};
      (data ?? []).forEach((p: any) => {
        rel[p.id] = {
          condominio_nome: p?.condominio?.nome ?? selected.nome ?? null,
          morador_nome: p?.morador?.nome ?? null,
          morador_email: p?.morador?.email ?? null,
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
  }, [selected, buscaDebounced, rowToPropriedade]);

  React.useEffect(() => {
    carregarPropriedades();
  }, [carregarPropriedades]);

  // ---- Realtime GLOBAL (sem filter); filtramos no cliente por condominio_id ----
  React.useEffect(() => {
    if (!selected) return;

    const channel = supabase
      .channel("propriedade-realtime-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "propriedade" },
        async (payload) => {
          const rowNew: any = payload.new ?? null;
          const rowOld: any = payload.old ?? null;

          const condominioId =
            rowNew?.condominio_id ?? rowOld?.condominio_id ?? null;
          if (!condominioId || condominioId !== selected.id) return;

          // Com busca ativa, refetch mantém a coerência do filtro
          if (buscaDebounced) {
            await carregarPropriedades();
            return;
          }

          if (payload.eventType === "INSERT" && rowNew) {
            setPropriedades((prev) =>
              prev.some((p) => p.id === rowNew.id)
                ? prev
                : [rowToPropriedade(rowNew), ...prev]
            );

            const rel = await fetchRelationsFor(rowNew.id);
            setRelationsById((prev) => ({ ...prev, [rowNew.id]: rel }));
          }

          if (payload.eventType === "UPDATE" && rowNew) {
            const updated = rowToPropriedade(rowNew);

            setPropriedades((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );

            const rel = await fetchRelationsFor(updated.id);
            setRelationsById((prev) => ({ ...prev, [updated.id]: rel }));
          }

          if (payload.eventType === "DELETE" && rowOld) {
            const idRemovido = rowOld.id as string;
            setPropriedades((prev) => prev.filter((p) => p.id !== idRemovido));
            setRelationsById((prev) => {
              const { [idRemovido]: _omit, ...rest } = prev;
              return rest;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, buscaDebounced, carregarPropriedades, rowToPropriedade, fetchRelationsFor]);

  // (Opcional) remoção otimista se quiser disparar um evento no delete do card
  React.useEffect(() => {
    function onDeleted(e: any) {
      const id = e?.detail?.id;
      if (!id) return;
      setPropriedades((prev) => prev.filter((p) => p.id !== id));
      setRelationsById((prev) => {
        const { [id]: _omit, ...rest } = prev;
        return rest;
      });
    }
    window.addEventListener("propriedade:deleted", onDeleted);
    return () => window.removeEventListener("propriedade:deleted", onDeleted);
  }, []);

  const handleRefresh = () => {
    carregarPropriedades();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          {selected ? `Casas — ${selected.nome}` : "Casas"}
        </h2>

        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            placeholder="Buscar por morador, tipo ou nome da propriedade…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="sm:w-80"
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

          <CreateCasaDialog
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
              <CasaCard
                key={p.id}
                propriedade={p}
                relations={relationsById[p.id]}
              />
            ))}
      </div>
    </div>
  );
}
