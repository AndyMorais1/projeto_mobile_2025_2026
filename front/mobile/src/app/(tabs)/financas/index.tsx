import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { CardFinanceiro, SearchBar, ModalPagamento} from "@/components/financas";




export default function Financas() {
    const [activeTable, setActiveTable] = useState<"pagamentos" | "recibos">("pagamentos");

    // ======= DADOS SIMULADOS =======
    const pagamentos = [
        { descricao: "Água", valor: 33, mes: "Setembro", ano: 2025 },
        { descricao: "Gás", valor: 29.69, mes: "Setembro", ano: 2025 },
        { descricao: "Electricidade", valor: 22, mes: "Setembro", ano: 2025 },
    ];

    const recibos = [
        { data: "18/09/2025", descricao: "Água" },
        { data: "18/09/2025", descricao: "Conta de água" },
    ];

    // ======= ESTADOS DO MODAL =======
    const [modalVisible, setModalVisible] = useState(false);
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState<any>(null);

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
                <SearchBar
                    value={""}
                    onChangeText={() => {}}
                />
            )}

            {/* Lista de PAGAMENTOS */}
            {activeTable === "pagamentos" && (
                <FlatList
                    data={pagamentos}
                    keyExtractor={(item, i) => i.toString()}
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
            {activeTable === "recibos" && (
                <FlatList
                    data={recibos}
                    keyExtractor={(item, i) => i.toString()}
                    renderItem={({ item }) => (
                        <CardFinanceiro tipo="recibo" {...item} />
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
            <ModalPagamento
                visible={modalVisible}
                valor={pagamentoSelecionado?.valor}
                descricao={pagamentoSelecionado?.descricao}
                onClose={() => setModalVisible(false)}
                onConfirm={(metodo: any) => {
                    console.log("Pagamento confirmado via", metodo);
                    setModalVisible(false);
                }}
            />
        </View>
    );
}
