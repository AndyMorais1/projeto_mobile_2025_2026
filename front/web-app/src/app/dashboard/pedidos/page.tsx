// Ajuste visual: cards mais retangulares e layout em 2 colunas
"use client";

import * as React from "react";
import PedidoCard, { type Pedido } from "@/components/myComponents/PedidoCard";
import { useCondominium } from "@/context/CondominiumProvider";
import { supabase } from "@/api/Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCcw } from "lucide-react";

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const { selected } = useCondominium();
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [estado, setEstado] = React.useState<string>("todos");

  const hasSelection = !!selected?.id;

  // Debounce busca
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const carregarPedidos = React.useCallback(async () => {
    if (!hasSelection) {
      setPedidos([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const { data: propsData, error: propsErr } = await supabase
        .from("propriedade")
        .select("morador_id")
        .eq("condominio_id", selected!.id)
        .not("morador_id", "is", null);
      if (propsErr) throw propsErr;

      const moradorIds = Array.from(
        new Set((propsData ?? []).map((r: any) => r.morador_id!).filter(Boolean))
      );

      if (moradorIds.length === 0) {
        setPedidos([]);
        setTotal(0);
        return;
      }

      let query = supabase
        .from("pedido")
        .select(
          `id,titulo,descricao,tipo_pedido,estado_pedido,resposta,created_at,updated_at,morador_id,
           categoria,data_prevista,hora_prevista,urgencia,orcamento_max,
           morador:morador_id(id,nome,email)`,
          { count: "exact" }
        )
        .in("morador_id", moradorIds)
        .order("created_at", { ascending: false });

      if (estado !== "todos") query = query.eq("estado_pedido", estado);
      if (debouncedSearch)
        query = query.or(
          `titulo.ilike.%${debouncedSearch}%,descricao.ilike.%${debouncedSearch}%`
        );

      const rangeFrom = page * PAGE_SIZE;
      const rangeTo = rangeFrom + PAGE_SIZE - 1;

      const { data, error, count } = await query.range(rangeFrom, rangeTo);
      if (error) throw error;

      setPedidos((data as any) ?? []);
      setTotal(count ?? 0);
    } catch (e) {
      console.error(e);
      setPedidos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [hasSelection, selected?.id, page, debouncedSearch, estado]);

  React.useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // --- 🔴 Realtime ---
  React.useEffect(() => {
    if (!selected?.id) return;

    const channel = supabase
      .channel(`pedidos_realtime_${selected.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // insert | update | delete
          schema: "public",
          table: "pedido",
        },
        (payload) => {
          console.log("Realtime update:", payload);
          // throttled reload
          carregarPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected?.id, carregarPedidos]);

  function handleUpdated(patch: { id: string } & Partial<Pedido>) {
    setPedidos((prev) =>
      prev.map((p) => (p.id === patch.id ? { ...p, ...patch } : p))
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <h2 className="text-xl font-semibold">
        {selected ? `Pedidos — ${selected.nome}` : "Pedidos"}
      </h2>

      {!hasSelection ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Selecione um <span className="font-medium">condomínio</span> para ver os pedidos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Filtros e busca */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por título ou descrição..."
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setPage(0);
                  carregarPedidos();
                }}
                className="gap-2"
                title="Limpar busca"
              >
                <RefreshCcw className="h-4 w-4" /> Limpar
              </Button>
            </div>

            <Select
              value={estado}
              onValueChange={(v) => {
                setPage(0);
                setEstado(v);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={carregarPedidos}
              className="gap-2"
              title="Atualizar lista"
            >
              <RefreshCcw className="h-4 w-4" /> Atualizar
            </Button>
          </div>

          {/* Cards em 2 colunas fixas e retangulares */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando pedidos...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {pedidos.map((p) => (
                <div key={p.id} className="h-full">
                  <PedidoCard pedido={p} onUpdated={handleUpdated} />
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage((x) => Math.max(0, x - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((x) => x + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
