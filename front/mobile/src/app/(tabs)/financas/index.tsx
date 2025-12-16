import { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Linking,
} from "react-native";
import {
    CardFinanceiro,
    SearchBar,
    ModalPagamento,
} from "@/components/financas";
// ajusta o caminho se o teu client estiver noutro sítio
import { supabase } from "@/api/client";

type PagamentoItem = {
    id: string;          // id da fatura
    descricao: string;
    valor: number;
    mes: string;
    ano: number;
};

type ReciboItem = {
    id: string;          // id da fatura
    descricao: string;
    data: string;
    reciboUrl: string | null; // <- NOVO: URL do recibo no Supabase
};

export default function Financas() {
    const [activeTable, setActiveTable] =
        useState<"pagamentos" | "recibos">("pagamentos");

    // ======= DADOS SIMULADOS =======
    // agora vamos buscar do Supabase, mas deixo o comentário :)
    const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
    const [recibos, setRecibos] = useState<ReciboItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // ======= ESTADOS DO MODAL =======
    const [modalVisible, setModalVisible] = useState(false);
    const [pagamentoSelecionado, setPagamentoSelecionado] =
        useState<PagamentoItem | null>(null);

    const carregarDados = useCallback(async () => {
        setLoading(true);
        setErro(null);

        try {
            // 1) user autenticado
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) {
                setErro("Utilizador não autenticado.");
                setPagamentos([]);
                setRecibos([]);
                return;
            }

            // 2) propriedades deste morador
            const { data: props, error: propsError } = await supabase
                .from("propriedade")
                .select("id")
                .eq("morador_id", user.id);

            if (propsError) throw propsError;

            const propriedadeIds = (props ?? []).map((p: any) => p.id);
            if (propriedadeIds.length === 0) {
                setPagamentos([]);
                setRecibos([]);
                return;
            }

            // 3) faturas dessas propriedades
            const { data: faturas, error: fatError } = await supabase
                .from("fatura")
                .select(
                    `
          id,
          titulo,
          valor,
          estado_fatura,
          created_at,
          updated_at,
          propriedade_id,
          recibo_url
        `
                )
                .in("propriedade_id", propriedadeIds)
                .order("created_at", { ascending: true });

            if (fatError) throw fatError;

            const lista = faturas ?? [];

            // pendentes → pagamentos
            const pendentes: PagamentoItem[] = lista
                .filter((f: any) => f.estado_fatura === "pendente")
                .map((f: any) => {
                    const d = f.created_at ? new Date(f.created_at) : new Date();
                    return {
                        id: f.id,
                        descricao: f.titulo,
                        valor: Number(f.valor ?? 0),
                        mes: d.toLocaleDateString("pt-PT", { month: "long" }),
                        ano: d.getFullYear(),
                    };
                });

            // pagos → recibos
            const pagos: ReciboItem[] = lista
                .filter((f: any) => f.estado_fatura === "pago")
                .map((f: any) => {
                    const d = f.updated_at ? new Date(f.updated_at) : new Date();
                    return {
                        id: f.id,
                        descricao: f.titulo,
                        data: d.toLocaleDateString("pt-PT"),
                        reciboUrl: f.recibo_url ?? null,  // <- aqui
                    };
                });

            setPagamentos(pendentes);
            setRecibos(pagos);
        } catch (e: any) {
            console.error(e);
            setErro(e?.message || "Erro ao carregar dados.");
            setPagamentos([]);
            setRecibos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void carregarDados();
    }, [carregarDados]);

    // realtime simples: se alguma fatura mudar, recarrega
    useEffect(() => {
        const channel = supabase
            .channel("faturas-morador")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "fatura" },
                () => {
                    void carregarDados();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [carregarDados]);

    async function handleDownloadRecibo(item: ReciboItem) {
        if (!item.reciboUrl) {
            Alert.alert("Recibo ainda não disponível");
            return;
        }

        try {
            const supported = await Linking.canOpenURL(item.reciboUrl);
            if (!supported) {
                Alert.alert("Não foi possível abrir o recibo.");
                return;
            }
            await Linking.openURL(item.reciboUrl);
        } catch (e) {
            console.error("Erro ao abrir recibo:", e);
            Alert.alert("Erro ao abrir o recibo.");
        }
    }

    // ======= INTERFACE =======
    return (
        <View className="flex-1 bg-white pt-6 px-4">
            {/* Botões de abas */}
            <View className="flex-row justify-around mb-8">
                <Text
                    onPress={() => setActiveTable("pagamentos")}
                    className={`text-lg font-semibold ${
                        activeTable === "pagamentos"
                            ? "text-blue-500 border-b-2 border-blue-500 pb-1"
                            : "text-gray-500"
                    }`}
                >
                    Pagamentos
                </Text>
                <Text
                    onPress={() => setActiveTable("recibos")}
                    className={`text-lg font-semibold ${
                        activeTable === "recibos"
                            ? "text-blue-500 border-b-2 border-blue-500 pb-1"
                            : "text-gray-500"
                    }`}
                >
                    Recibos
                </Text>
            </View>

            {/* Barra de pesquisa */}
            {activeTable === "recibos" && (
                <SearchBar value={""} onChangeText={() => {}} />
            )}

            {loading && (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                </View>
            )}

            {!loading && erro && (
                <View className="items-center py-20">
                    <Text className="text-red-500 text-center">{erro}</Text>
                </View>
            )}

            {/* Lista de PAGAMENTOS */}
            {!loading && !erro && activeTable === "pagamentos" && (
                <FlatList
                    data={pagamentos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CardFinanceiro
                            tipo="pagamento"
                            {...item}
                            onPagar={() => {
                                setPagamentoSelecionado(item);
                                setModalVisible(true);
                            }}
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View className="items-center py-20">
                            <Text className="text-gray-400">
                                Nenhum pagamento registado ainda
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}

            {/* Lista de RECIBOS */}
            {!loading && !erro && activeTable === "recibos" && (
                <FlatList
                    data={recibos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CardFinanceiro
                            tipo="recibo"
                            descricao={item.descricao}
                            data={item.data}
                            reciboUrl={item.reciboUrl}
                            onDownload={() => handleDownloadRecibo(item)}
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View className="items-center py-20">
                            <Text className="text-gray-400">
                                Nenhum recibo registado ainda
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}

            {/* MODAL DE PAGAMENTO */}
            {pagamentoSelecionado && (
                <ModalPagamento
                    visible={modalVisible}
                    valor={pagamentoSelecionado.valor}
                    descricao={pagamentoSelecionado.descricao}
                    faturaId={pagamentoSelecionado.id}
                    onClose={() => setModalVisible(false)}
                    onPaid={carregarDados}
                />
            )}
        </View>
    );
}
