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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RefreshCcw } from "lucide-react";

export default function HousesPage() {
  const { selected } = useCondominium();
  const [propriedades, setPropriedades] = React.useState<Propriedade[]>([]);
  const [relationsById, setRelationsById] = React.useState<
    Record<string, PropriedadeRelations>
  >({});
  const [carregar, setCarregar] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  // 🔎 Busca
  const [busca, setBusca] = React.useState("");
  const [buscaDebounced, setBuscaDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [busca]);

  // 🎛️ Filtros adicionais
  const [estadoFiltro, setEstadoFiltro] = React.useState("todos");

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

      const { data, error } = await query;
      if (error) throw error;

      let list: any[] = data ?? [];

      // 🔍 Filtro manual (busca + estado + estacionamento)
      list = list.filter((p) => {
        const moradorNome = p.morador?.nome?.toLowerCase() ?? "";
        const moradorEmail = p.morador?.email?.toLowerCase() ?? "";
        const tipo = p.tipo_propriedade?.toLowerCase() ?? "";
        const nome = p.nome_propriedade?.toLowerCase() ?? "";
        const estado = p.estado_propriedade?.toLowerCase() ?? "";

        const matchBusca =
          !buscaDebounced ||
          moradorNome.includes(buscaDebounced) ||
          moradorEmail.includes(buscaDebounced) ||
          tipo.includes(buscaDebounced) ||
          nome.includes(buscaDebounced);

        const matchEstado =
          estadoFiltro === "todos" || estado === estadoFiltro;

        return matchBusca && matchEstado ;
      });

      const listProps: Propriedade[] = list.map(rowToPropriedade);
      const rel: Record<string, PropriedadeRelations> = {};
      list.forEach((p) => {
        rel[p.id] = {
          condominio_nome: p?.condominio?.nome ?? selected.nome ?? null,
          morador_nome: p?.morador?.nome ?? null,
          morador_email: p?.morador?.email ?? null,
        };
      });

      setPropriedades(listProps);
      setRelationsById(rel);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar propriedades.");
      setPropriedades([]);
      setRelationsById({});
    } finally {
      setCarregar(false);
    }
  }, [selected, buscaDebounced, estadoFiltro,  rowToPropriedade]);

  React.useEffect(() => {
    carregarPropriedades();
  }, [carregarPropriedades]);

  // 🔁 Realtime
  React.useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel("propriedade-realtime-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "propriedade" },
        () => {
          void carregarPropriedades();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selected, carregarPropriedades]);

  const handleRefresh = () => carregarPropriedades();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          {selected ? `Casas — ${selected.nome}` : "Casas"}
        </h2>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {/* 🔍 Busca */}
          <Input
            placeholder="Buscar por morador, tipo ou nome da propriedade…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="sm:w-72"
          />

          {/* 🎛️ Filtro estado */}
          <Select
            value={estadoFiltro}
            onValueChange={setEstadoFiltro}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="ocupada">Ocupada</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔁 Botões */}
          <Button
            variant="outline"
            onClick={() => {
              setBusca("");
              setBuscaDebounced("");
              setEstadoFiltro("todos");
              carregarPropriedades();
            }}
            className="gap-2"
            title="Limpar filtros"
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

      {erro && (
        <div className="rounded-xl border p-4 text-sm text-destructive">
          Erro a carregar: {erro}
        </div>
      )}

      {!carregar && propriedades.length === 0 && (
        <h1 className="text-center text-muted-foreground">
          {selected
            ? "Nenhuma propriedade encontrada com esses filtros."
            : "Selecione um condomínio para ver as propriedades."}
        </h1>
      )}

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
