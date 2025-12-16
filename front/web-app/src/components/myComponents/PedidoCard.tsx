"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    MessageSquareMore,
    Lightbulb,
    CalendarDays,
    Clock3,
    Tag,
    User2,
    Home,
    AlertTriangle,
    Info,
    Award,
    Ban,
    Mail,
    Wallet,
    Euro,
    Phone,
} from "lucide-react";
import { resolverCSP, type CategoriaManutencao } from "@/lib/cspSolver";

export type PedidoEstado = "pendente" | "aprovado" | "rejeitado" | string;

export type Pedido = {
    id: string;
    titulo: string;
    descricao: string | null;
    tipo_pedido: string;
    estado_pedido: PedidoEstado;
    resposta?: string | null;
    created_at: string;
    updated_at: string;
    morador_id: string | null;
    categoria?: string | null;
    data_prevista?: string | null;
    hora_prevista?: string | null;
    urgencia?: string | null;
    orcamento_max?: number | null;
    morador?: { id: string; nome?: string | null; email?: string | null } | null;
};

type Casa = {
    id: string;
    nome_propriedade: string | null;
};

type Fornecedor = {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    avaliacao_media?: number | null;
    disponibilidade?: boolean | null;
    servicos?: { tipo_servico: string; preco_medio?: number | null }[];
    score?: number;
};

interface PedidoCardProps {
    pedido: Pedido;
    onUpdated?: (partial: { id: string } & Partial<Pedido>) => void;
}

export default function PedidoCard({ pedido, onUpdated }: PedidoCardProps) {
    const [open, setOpen] = React.useState(false);
    const [resposta, setResposta] = React.useState(pedido.resposta ?? "");
    const [estado, setEstado] = React.useState<PedidoEstado>(
        pedido.estado_pedido
    );
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [casas, setCasas] = React.useState<Casa[] | null>(null);
    const [cLoading, setCLoading] = React.useState(false);

    const [openSugs, setOpenSugs] = React.useState(false);
    const [fornecedores, setFornecedores] = React.useState<Fornecedor[]>([]);
    const [loadingFornecedores, setLoadingFornecedores] = React.useState(false);

    const isFechado =
        pedido.estado_pedido === "aprovado" || pedido.estado_pedido === "rejeitado";

    React.useEffect(() => {
        setResposta(pedido.resposta ?? "");
        setEstado(pedido.estado_pedido);
    }, [pedido.id, pedido.resposta, pedido.estado_pedido]);

    React.useEffect(() => {
        (async () => {
            if (!pedido.morador_id) {
                setCasas([]);
                return;
            }
            setCLoading(true);
            try {
                const { data } = await supabase
                    .from("propriedade")
                    .select("id,nome_propriedade")
                    .eq("morador_id", pedido.morador_id);
                setCasas((data as Casa[]) ?? []);
            } catch {
                setCasas([]);
            } finally {
                setCLoading(false);
            }
        })();
    }, [pedido.morador_id]);

    async function carregarFornecedoresCompatíveis() {
        setLoadingFornecedores(true);
        try {
            const { data, error } = await supabase.from("fornecedor").select(`
          id, nome, email, telefone, avaliacao_media, disponibilidade,
          fornecedor_servico:fornecedor_servico (
            tipo_servico, preco_medio
          )
        `);
            if (error) throw error;

            const fornecedoresBrutos =
                (data ?? []).map((f: any) => ({
                    id: f.id,
                    nome: f.nome,
                    email: f.email,
                    telefone: f.telefone,
                    avaliacao_media: f.avaliacao_media,
                    disponibilidade: f.disponibilidade,
                    servicos: f.fornecedor_servico ?? [],
                })) ?? [];

            // normaliza a urgência para "baixa" | "media" | "alta" | null
            const urgenciaNormalizada = (() => {
                const u = (pedido.urgencia ?? "").toLowerCase();
                if (["baixa", "media", "alta"].includes(u))
                    return u as "baixa" | "media" | "alta";
                return null;
            })();

          // categorias válidas vindas do enum do Supabase
            const CATEGORIAS_VALIDAS: CategoriaManutencao[] = [
                "eletricista", "canalizador", "limpeza", "pintura",
                "jardinagem", "outro",
            ];

          // normaliza categoria para CategoriaManutencao | null
            const categoriaNormalizada: CategoriaManutencao | null =
                pedido.categoria &&
                CATEGORIAS_VALIDAS.includes(pedido.categoria as CategoriaManutencao)
                    ? (pedido.categoria as CategoriaManutencao)
                    : null;

            const solucoes = resolverCSP(
                {
                    categoria: categoriaNormalizada,
                    urgencia: urgenciaNormalizada,
                    orcamento_max: pedido.orcamento_max ?? null,
                },
                fornecedoresBrutos
            );


            setFornecedores(
                solucoes.map((s) => ({
                    ...s.fornecedor,
                    score: s.score,
                }))
            );
        } catch (e) {
            console.error("Erro ao buscar fornecedores:", e);
            setFornecedores([]);
        } finally {
            setLoadingFornecedores(false);
        }
    }

    async function handleSave() {
        setError(null);
        if (!resposta.trim() || !estado) {
            setError("Preencha a resposta e selecione o estado do pedido.");
            return;
        }
        setSaving(true);
        try {
            const { error: upErr, data } = await supabase
                .from("pedido")
                .update({ resposta: resposta.trim(), estado_pedido: estado })
                .eq("id", pedido.id)
                .select("id,resposta,estado_pedido,updated_at")
                .single();
            if (upErr) throw upErr;

            onUpdated?.({
                id: pedido.id,
                resposta: data?.resposta ?? null,
                estado_pedido: (data?.estado_pedido as PedidoEstado) ?? estado,
                updated_at: data?.updated_at ?? new Date().toISOString(),
            });
            setOpen(false);
        } catch (e: any) {
            setError(e?.message ?? "Falha ao salvar resposta.");
        } finally {
            setSaving(false);
        }
    }

    const estadoColor: Record<string, string> = {
        pendente: "bg-amber-100 text-amber-800",
        aprovado: "bg-emerald-100 text-emerald-800",
        rejeitado: "bg-rose-100 text-rose-800",
    };

    const urgenciaColor: Record<string, string> = {
        baixa: "bg-slate-100 text-slate-800",
        media: "bg-sky-100 text-sky-800",
        alta: "bg-orange-100 text-orange-800",
        critica: "bg-red-100 text-red-800",
    };

    return (
        <Card className="w-full shadow-sm hover:shadow transition-shadow">
            {/* Cabeçalho */}
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-semibold leading-tight">
                            {pedido.titulo}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                                variant="secondary"
                                className="capitalize flex items-center gap-1"
                            >
                                <Tag className="h-3 w-3" /> {pedido.tipo_pedido}
                            </Badge>
                            {pedido.categoria && (
                                <Badge variant="outline" className="capitalize">
                                    {pedido.categoria}
                                </Badge>
                            )}
                            {pedido.urgencia && (
                                <Badge
                                    className={
                                        "capitalize " +
                                        (urgenciaColor[(pedido.urgencia || "").toLowerCase()] ?? "")
                                    }
                                >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {pedido.urgencia}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Badge
                        className={
                            "capitalize " + (estadoColor[pedido.estado_pedido] ?? "")
                        }
                    >
                        {pedido.estado_pedido}
                    </Badge>
                </div>

                {/* Datas, orçamento e morador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {pedido.data_prevista && (
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Data prevista: {pedido.data_prevista}
                        </div>
                    )}
                    {pedido.hora_prevista && (
                        <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            Hora prevista: {pedido.hora_prevista.slice(0, 5)}
                        </div>
                    )}

                    {pedido.orcamento_max !== null &&
                        pedido.orcamento_max !== undefined && (
                            <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4" /> Orçamento máx.:{" "}
                                <span className="font-medium text-foreground">
                  €{Number(pedido.orcamento_max).toFixed(2)}
                </span>
                            </div>
                        )}

                    {pedido.morador?.nome && (
                        <div className="flex items-center gap-2">
                            <User2 className="h-4 w-4" /> Morador: {pedido.morador.nome}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {cLoading ? (
                            <span>Casa: carregando...</span>
                        ) : casas && casas.length > 0 ? (
                            <span>
                Casa:{" "}
                                {casas
                                    .map((c) => c.nome_propriedade || "<sem nome>")
                                    .join(", ")}
              </span>
                        ) : (
                            <span>Casa: —</span>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* Conteúdo */}
            <CardContent className="space-y-4">
                {pedido.descricao ? (
                    <div>
                        <Label className="text-xs uppercase text-muted-foreground">
                            Descrição
                        </Label>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                            {pedido.descricao}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" /> Sem descrição.
                    </div>
                )}

                <Separator />

                {pedido.resposta ? (
                    <div>
                        <Label className="text-xs uppercase text-muted-foreground">
                            Resposta do admin
                        </Label>
                        <p className="mt-1 whitespace-pre-wrap">{pedido.resposta}</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Sem resposta ainda.</p>
                )}
            </CardContent>

            {/* Rodapé / Ações */}
            <CardFooter className="flex items-center justify-end gap-2">
                {/* Sugestões de fornecedor */}
                <Dialog
                    open={openSugs}
                    onOpenChange={(v) => {
                        if (!isFechado) {
                            setOpenSugs(v);
                            if (v) carregarFornecedoresCompatíveis();
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            disabled={isFechado}
                        >
                            {isFechado ? (
                                <Ban className="h-4 w-4" />
                            ) : (
                                <Lightbulb className="h-4 w-4" />
                            )}
                            Sugestões
                        </Button>
                    </DialogTrigger>

                    {!isFechado && (
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Fornecedores compatíveis (CSP)</DialogTitle>
                                <DialogDescription>
                                    Selecionamos fornecedores ideais para o tipo e urgência do
                                    pedido.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 max-h-[70vh] overflow-auto">
                                {loadingFornecedores ? (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando
                                        fornecedores...
                                    </div>
                                ) : fornecedores.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        Nenhum fornecedor compatível encontrado.
                                    </div>
                                ) : (
                                    fornecedores.map((f) => (
                                        <div
                                            key={f.id}
                                            className="border rounded-xl p-3.5 bg-card space-y-2 shadow-sm hover:shadow transition-all duration-200"
                                        >
                                            {/* Cabeçalho */}
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-col">
                                                    <h3 className="text-sm font-semibold text-foreground truncate max-w-[240px]">
                                                        {f.nome}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                        {/* Avaliação */}
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <span key={i}>
                                  {i < Math.round(f.avaliacao_media ?? 0)
                                      ? "⭐"
                                      : ""}
                                </span>
                                                            ))}
                                                            <span className="ml-1 text-[11px]">
                                {f.avaliacao_media
                                    ? f.avaliacao_media.toFixed(1)
                                    : "—"}{" "}
                                                                / 5
                              </span>
                                                        </div>

                                                        {/* Disponibilidade */}
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                                f.disponibilidade
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-rose-100 text-rose-700"
                                                            }`}
                                                        >
                              {f.disponibilidade
                                  ? "Disponível"
                                  : "Indisponível"}
                            </span>
                                                    </div>
                                                </div>

                                                {/* Compatibilidade */}
                                                <Badge
                                                    variant="outline"
                                                    className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
                                                >
                                                    {Math.round((f.score ?? 0) * 100)}% compatível
                                                </Badge>
                                            </div>

                                            {/* Serviços oferecidos */}
                                            {f.servicos && f.servicos.length > 0 && (
                                                <div>
                                                    <Label className="text-[11px] uppercase text-muted-foreground">
                                                        Serviços e preço médio
                                                    </Label>
                                                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                                        {f.servicos.map((s, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex  justify-center gap-2 bg-muted/80 rounded-md px-2 py-1 text-xs"
                                                            >
                                <span className="capitalize flex items-center gap-1 truncate">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                    {s.tipo_servico}
                                </span>
                                                                <span className="font-medium text-foreground">
                                  {s.preco_medio != null
                                      ? `€${s.preco_medio.toFixed(2)}`
                                      : "—"}
                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contatos + ação */}
                                            <Label className="text-[11px] uppercase text-muted-foreground">
                                                Contatos
                                            </Label>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3.5 w-3.5 text-foreground/70" />
                                                        <span>{f.telefone || "Sem telefone"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3.5 w-3.5 text-foreground/70" />
                                                        <span>{f.email || "Sem email"}</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="gap-1 text-xs h-7 px-3"
                                                    onClick={() => {
                                                        const nomeMorador = pedido.morador?.nome
                                                            ? `Caro(a) ${pedido.morador.nome},`
                                                            : "Caro morador,";
                                                        const data = pedido.data_prevista
                                                            ? `no dia ${pedido.data_prevista}`
                                                            : "em breve";
                                                        const hora = pedido.hora_prevista
                                                            ? `às ${pedido.hora_prevista.slice(0, 5)}`
                                                            : "";
                                                        const texto = `${nomeMorador}\n\nEncontrámos um profissional qualificado (${
                                                            f.nome
                                                        }) para realizar o serviço de ${
                                                            pedido.categoria ?? pedido.tipo_pedido
                                                        }. O atendimento está agendado ${data} ${hora}. Pedimos que esteja disponível nesse horário para facilitar o acesso e execução do trabalho.\n\nAgradecemos pela sua colaboração.\n\nAtenciosamente,\nGestão do Condomínio.`;
                                                        setResposta(texto);
                                                        setOpenSugs(false);
                                                        setOpen(true);
                                                    }}
                                                >
                                                    Selecionar
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenSugs(false)}>
                                    Fechar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>

                {/* Resposta manual */}
                <Dialog
                    open={open}
                    onOpenChange={(isOpen) => {
                        if (!isFechado) {
                            setOpen(isOpen);
                            if (isOpen) {
                                setResposta(pedido.resposta ?? "");
                                setEstado(pedido.estado_pedido);
                            }
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            disabled={isFechado}
                        >
                            {isFechado ? (
                                <Ban className="h-4 w-4" />
                            ) : (
                                <MessageSquareMore className="h-4 w-4" />
                            )}
                            Responder
                        </Button>
                    </DialogTrigger>

                    {!isFechado && (
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Responder pedido</DialogTitle>
                                <DialogDescription>
                                    Escreva uma resposta e atualize o estado do pedido.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="resposta">Resposta</Label>
                                    <Textarea
                                        id="resposta"
                                        placeholder="Digite a resposta para o morador..."
                                        value={resposta}
                                        onChange={(e) => setResposta(e.target.value)}
                                        className="min-h-[140px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Estado do pedido</Label>
                                    <Select
                                        value={estado}
                                        onValueChange={(v) => setEstado(v as PedidoEstado)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione o estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="aprovado">Aprovado</SelectItem>
                                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {error && <p className="text-sm text-rose-600">{error}</p>}
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !resposta.trim() || !estado}
                                >
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
            </CardFooter>
        </Card>
    );
}
