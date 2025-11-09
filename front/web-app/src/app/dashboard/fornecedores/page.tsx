"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, RefreshCcw, Plus } from "lucide-react";
import { FornecedorCard } from "@/components/myComponents/FornecedorCard";
import { CreateFornecedorDialog } from "@/components/myComponents/CreateFornecedorDialog";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filtro, setFiltro] = React.useState("todos");
  const [openCreate, setOpenCreate] = React.useState(false);

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  async function carregarFornecedores() {
    setLoading(true);
    try {
      let query = supabase
        .from("fornecedor")
        .select(
          `id, nome, email, telefone, avaliacao_media, disponibilidade,
           fornecedor_servico ( tipo_servico, preco_medio )`
        )
        .order("nome", { ascending: true });

      if (filtro !== "todos") {
        query = query.eq("disponibilidade", filtro === "disponivel");
      }

      if (debouncedSearch) {
        query = query.or(
          `nome.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setFornecedores(
        (data ?? []).map((f: any) => ({
          ...f,
          servicos: f.fornecedor_servico ?? [],
        }))
      );
    } catch (e) {
      console.error(e);
      setFornecedores([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarFornecedores();
  }, [debouncedSearch, filtro]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex items-center justify-between"></div>

      {/* Filtros e busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
            }}
            className="gap-2"
            title="Limpar busca"
          >
            <RefreshCcw className="h-4 w-4" /> Limpar
          </Button>
        </div>

        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="indisponivel">Indisponível</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo fornecedor
        </Button>

        <Button
          variant="outline"
          onClick={carregarFornecedores}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando
          fornecedores...
        </div>
      ) : fornecedores.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum fornecedor encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fornecedores.map((f) => (
            <FornecedorCard
              key={f.id}
              fornecedor={f}
              onUpdated={carregarFornecedores}
              onDeleted={carregarFornecedores}
            />
          ))}
        </div>
      )}

      {/* Criar fornecedor */}
      <CreateFornecedorDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={carregarFornecedores}
      />
    </div>
  );
}
