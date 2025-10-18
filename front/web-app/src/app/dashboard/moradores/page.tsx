"use client";

import * as React from "react";
import { MoradorCard } from "@/components/myComponents/MoradorCard";
import type { Morador } from "@/components/myComponents/MoradorCard";
import { CreateMoradorDialog } from "@/components/myComponents/CreateMoradorDialog";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";

export default function UsersPage() {
  const { selected } = useCondominium();
  const [moradores, setMoradores] = React.useState<Morador[]>([]);
  const [carregar, setCarregar] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const carregarMoradores = React.useCallback(async () => {
    if (!selected) {
      setMoradores([]);
      setCarregar(false);
      return;
    }

    setCarregar(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from("morador")
        .select(`
          id, nome, email, telefone, bi, estado_utilizador, foto, created_at, updated_at,
          propriedade!inner(
            id,
            condominio_id,
            nome_propriedade,
            condominio:condominio_id (
              id,
              nome
            )
          )
        `)
        .eq("propriedade.condominio_id", selected.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const seen = new Set<string>();
      const unique: Morador[] = (data as any[]).reduce((acc, row) => {
        if (seen.has(row.id)) return acc;
        seen.add(row.id);

        const propsArr = Array.isArray(row.propriedade) ? row.propriedade : [row.propriedade].filter(Boolean);

        // escolhe a propriedade do condomínio selecionado (ou a primeira)
        const prop = propsArr.find((p: any) =>
          p?.condominio_id === selected.id || p?.condominio?.id === selected.id
        ) ?? propsArr[0];

        const condominioNome = prop?.condominio?.nome ?? selected.nome ?? null;
        const propLabel = prop?.nome_propriedade ?? null;

        acc.push({
          id: row.id,
          nome: row.nome,
          email: row.email,
          telefone: row.telefone ?? "",
          bi: row.bi ?? "",
          estado_utilizador: row.estado_utilizador,
          foto: row.foto ?? "",
          created_at: row.created_at,
          updated_at: row.updated_at,
          condominio: condominioNome,
          propriedade: propLabel,
        } as Morador);

        return acc;
      }, [] as Morador[]);

      setMoradores(unique);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar moradores.");
      setMoradores([]);
    } finally {
      setCarregar(false);
    }
  }, [selected]);

  React.useEffect(() => {
    carregarMoradores();
  }, [carregarMoradores]);

  React.useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel("moradores-por-condominio-1n")
      .on("postgres_changes", { event: "*", schema: "public", table: "morador" }, () => carregarMoradores())
      .on("postgres_changes", { event: "*", schema: "public", table: "propriedade", filter: `condominio_id=eq.${selected.id}` }, () => carregarMoradores())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected, carregarMoradores]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {selected ? `Moradores — ${selected.nome}` : "Moradores"}
        </h2>
        <CreateMoradorDialog onCreated={carregarMoradores} />
      </div>

      {erro ? <div className="rounded-xl border p-4 text-sm text-destructive">Erro a carregar: {erro}</div> : null}

      {!carregar && moradores.length === 0 ? (
        <h1 className="text-center text-muted-foreground">
          {selected ? "Nenhum morador com propriedade neste condomínio." : "Selecione um condomínio acima para ver os moradores."}
        </h1>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {carregar
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border bg-muted/30" />
            ))
          : moradores.map((m) => <MoradorCard key={m.id} morador={m}  />)}
      </div>
    </div>
  );
}
