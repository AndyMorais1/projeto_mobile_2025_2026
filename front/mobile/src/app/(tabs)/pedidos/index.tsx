import { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { AdicionarPedidoSection, PedidosListSection } from "@/components/pedidos";
import { supabase } from "@/api/client";
import { testarConexaoSupabase } from "@/utils/testSupabase";

// ========================== Tipo interno para pedidos na UI ==========================
type PedidoUI = {
    id: string;
    titulo: string;
    estado: string;              // "Pendente", "Aprovado", ...
    data: string;                // data de criação (formatada pt-PT)
    tipo: string;                // tipo_pedido
    descricao?: string | null;
    respostaAdmin?: string | null;
    categoria?: string | null;
    urgencia?: string | null;
    orcamento_max?: number | null;
    data_prevista?: string | null;
    hora_prevista?: string | null;
};

export default function PedidosScreen() {
    // ========================== ESTADOS ==========================
    const [pedidos, setPedidos] = useState<PedidoUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // ========================== UTIL ==========================
    function formatarData(isoString: string) {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return isoString;
        return d.toLocaleDateString("pt-PT");
    }

    function mapEstado(dbEstado: string): string {
        switch (dbEstado) {
            case "pendente":
                return "Pendente";
            case "aprovado":
                return "Aprovado";
            case "rejeitado":
                return "Rejeitado";
            case "concluido":
                return "Concluido";
            default:
                // se vier algo inesperado, só capitaliza a primeira letra
                return dbEstado.charAt(0).toUpperCase() + dbEstado.slice(1);
        }
    }

    // ========================== BUSCAR USER E TESTAR CONEXÃO ==========================
    useEffect(() => {
        // testar conexão com Supabase (como já tinhas)
        testarConexaoSupabase();

        // obter utilizador autenticado
        async function fetchUser() {
            try {
                const { data } = await supabase.auth.getUser();
                if (data.user) {
                    setUserId(data.user.id);
                } else {
                    setUserId(null);
                }
            } catch (err) {
                console.error("Erro ao obter utilizador:", err);
                Alert.alert("Erro", "Falha ao obter sessão do utilizador.");
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    // ========================== CARREGAR PEDIDOS DO SUPABASE ==========================
    const carregarPedidos = useCallback(
        async (silent = false) => {
            if (!userId) return;

            if (!silent) setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("pedido")
                    .select(
                        `
                        id,
                        titulo,
                        descricao,
                        tipo_pedido,
                        estado_pedido,
                        resposta,
                        created_at,
                        categoria,
                        data_prevista,
                        hora_prevista,
                        urgencia,
                        orcamento_max
                    `
                    )
                    .eq("morador_id", userId)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const mapped: PedidoUI[] =
                    (data ?? []).map((p: any) => ({
                        id: p.id,
                        titulo: p.titulo,
                        estado: mapEstado(p.estado_pedido),
                        data: formatarData(p.created_at),
                        tipo: p.tipo_pedido,
                        descricao: p.descricao,
                        respostaAdmin: p.resposta,
                        categoria: p.categoria,
                        urgencia: p.urgencia,
                        orcamento_max: p.orcamento_max,
                        data_prevista: p.data_prevista,
                        hora_prevista: p.hora_prevista,
                    })) ?? [];

                setPedidos(mapped);
            } catch (err: any) {
                console.error("Erro ao carregar pedidos:", err.message || err);
                Alert.alert("Erro", "Não foi possível carregar os pedidos.");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [userId]
    );

    // carregar sempre que soubermos quem é o user
    useEffect(() => {
        if (userId) {
            carregarPedidos();
        }
    }, [userId, carregarPedidos]);

    // ========================== REALTIME (quando pedido é criado/atualizado/deletado) ==========================
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`pedidos_morador_${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "pedido",
                    filter: `morador_id=eq.${userId}`,
                },
                (_payload) => {
                    // Em vez de brincar com o payload, recarregamos a lista
                    carregarPedidos(true); // silent = true para não mostrar loading
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, carregarPedidos]);

    // ========================== AÇÕES ==========================
    const handleAdicionar = () => {
        // chamado depois que o modal criar um novo pedido com sucesso
        carregarPedidos();
    };

    const handleApagar = async (id: string) => {
        try {
            const { error } = await supabase
                .from("pedido")
                .delete()
                .eq("id", id);

            if (error) throw error;

            // recarrega a lista
            carregarPedidos();
        } catch (err: any) {
            console.error("Erro ao apagar pedido:", err.message || err);
            Alert.alert("Erro", "Não foi possível apagar o pedido.");
        }
    };

    const handleEditar = (_id: string, _novosDados: any) => {
        // ainda não implementado (caso queiras permitir edição futura)
        // por enquanto, não é usado na UI
    };

    // ========================== INTERFACE ==========================
    if (loading && !userId) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white pt-6 px-4">
            {/* Seção para adicionar novos pedidos */}
            <AdicionarPedidoSection onAdd={handleAdicionar} />

            {/* Seção para listar pedidos existentes */}
            <PedidosListSection
                pedidos={pedidos}
                onDelete={handleApagar}
                onEdit={handleEditar}
            />
        </View>
    );
}
