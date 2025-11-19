import { useState } from "react";
import {
    View,
    Text,
    FlatList,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import CardPedido from "./CardPedido";

interface Pedido {
    id: string;
    titulo: string;
    estado: string;
    data: string;
    tipo: string;
    descricao?: string | null;
    respostaAdmin?: string | null;
    categoria?: string | null;
    urgencia?: string | null;
    orcamento_max?: number | null;
    data_prevista?: string | null;
    hora_prevista?: string | null;
}

interface PedidosListProps {
    pedidos: Pedido[];
    onDelete: (id: string) => void;
    onEdit?: (id: string, novosDados: any) => void;
}

export default function PedidosListSection({ pedidos, onDelete }: PedidosListProps) {
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
    const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);

    const formatarDataPrevista = (dataISO?: string | null) => {
        if (!dataISO) return "-";
        const d = new Date(dataISO);
        if (Number.isNaN(d.getTime())) return dataISO;
        return d.toLocaleDateString("pt-PT");
    };

    const formatarHoraPrevista = (hora?: string | null) => {
        if (!hora) return "-";
        // se vier como "HH:MM:SS" ou "HH:MM", mostramos só HH:MM
        return hora.slice(0, 5);
    };

    return (
        <>
            {/* ====================== LISTA DE PEDIDOS ====================== */}
            <FlatList
                data={pedidos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CardPedido
                        titulo={item.titulo}
                        estado={item.estado}
                        data={item.data}
                        tipo={item.tipo}
                        temResposta={!!item.respostaAdmin}
                        onPress={() => {
                            setPedidoSelecionado(item);
                            setModalDetalhesVisivel(true);
                        }}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 30 }}
                ListEmptyComponent={() => (
                    <View className="items-center py-20">
                        <Text className="text-gray-400">
                            Nenhum pedido registrado ainda
                        </Text>
                    </View>
                )}
            />

            {/* ====================== MODAL DE DETALHES ====================== */}
            <Modal
                visible={modalDetalhesVisivel}
                transparent
                animationType="fade"
                onRequestClose={() => setModalDetalhesVisivel(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalDetalhesVisivel(false)}>
                    <View className="flex-1 justify-center items-center bg-black/25 px-4">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-2xl p-6 w-full shadow-md">
                                {pedidoSelecionado && (
                                    <>
                                        {/* Título */}
                                        <Text className="text-xl font-bold mb-4">
                                            {pedidoSelecionado.titulo}
                                        </Text>

                                        {/* Info geral (estado + data criação + tipo) */}
                                        <View className="mb-4">
                                            <Text className="text-gray-600">
                                                <Text className="font-semibold">Estado: </Text>
                                                {pedidoSelecionado.estado}
                                            </Text>
                                            <Text className="text-gray-600">
                                                <Text className="font-semibold">Data do pedido: </Text>
                                                {pedidoSelecionado.data}
                                            </Text>
                                            <Text className="text-gray-600">
                                                <Text className="font-semibold">Tipo: </Text>
                                                {pedidoSelecionado.tipo}
                                            </Text>
                                        </View>

                                        {/* Descrição */}
                                        <View className="bg-gray-100 rounded-xl p-4 mb-4 flex-row justify-between items-start">
                                            <Text className="text-gray-700 flex-1 mr-2">
                                                {pedidoSelecionado.descricao || "Sem descrição disponível."}
                                            </Text>

                                            {/* Ícone de edição só se for pendente (apenas visual por enquanto) */}
                                            {pedidoSelecionado.estado === "Pendente" && (
                                                <TouchableOpacity
                                                    onPress={() => console.log("Editar pedido")}
                                                >
                                                    <Feather name="edit-2" size={18} color="#3b82f6" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Detalhes de manutenção (se existirem) */}
                                        {(pedidoSelecionado.categoria ||
                                            pedidoSelecionado.urgencia ||
                                            pedidoSelecionado.orcamento_max ||
                                            pedidoSelecionado.data_prevista ||
                                            pedidoSelecionado.hora_prevista) && (
                                            <View className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <Text className="text-gray-800 font-semibold mb-2">
                                                    Detalhes do pedido
                                                </Text>

                                                {pedidoSelecionado.categoria && (
                                                    <Text className="text-gray-700 mb-1">
                                                        <Text className="font-semibold">Categoria: </Text>
                                                        {pedidoSelecionado.categoria}
                                                    </Text>
                                                )}

                                                {pedidoSelecionado.urgencia && (
                                                    <Text className="text-gray-700 mb-1">
                                                        <Text className="font-semibold">Urgência: </Text>
                                                        {pedidoSelecionado.urgencia}
                                                    </Text>
                                                )}

                                                {pedidoSelecionado.orcamento_max != null && (
                                                    <Text className="text-gray-700 mb-1">
                                                        <Text className="font-semibold">Orçamento máximo: </Text>
                                                        €{Number(pedidoSelecionado.orcamento_max).toFixed(2)}
                                                    </Text>
                                                )}

                                                {pedidoSelecionado.data_prevista && (
                                                    <Text className="text-gray-700 mb-1">
                                                        <Text className="font-semibold">Data prevista: </Text>
                                                        {formatarDataPrevista(pedidoSelecionado.data_prevista)}
                                                    </Text>
                                                )}

                                                {pedidoSelecionado.hora_prevista && (
                                                    <Text className="text-gray-700 mb-1">
                                                        <Text className="font-semibold">Hora prevista: </Text>
                                                        {formatarHoraPrevista(pedidoSelecionado.hora_prevista)}
                                                    </Text>
                                                )}
                                            </View>
                                        )}

                                        {/* Resposta do administrador */}
                                        {pedidoSelecionado?.respostaAdmin && (
                                            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                                <Text className="text-blue-700 font-semibold mb-1">
                                                    Resposta do administrador
                                                </Text>
                                                <Text className="text-gray-700">
                                                    {pedidoSelecionado.respostaAdmin}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Botão Apagar */}
                                        <TouchableOpacity
                                            className="bg-red-500 self-end rounded-full px-6 py-2"
                                            onPress={() => {
                                                onDelete(pedidoSelecionado.id);
                                                setModalDetalhesVisivel(false);
                                            }}
                                        >
                                            <Text className="text-white font-semibold">Apagar</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}
