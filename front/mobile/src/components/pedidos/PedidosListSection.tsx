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
    titulo: string;
    estado: string;
    data: string;
    tipo: string;
    descricao?: string;
}

interface PedidosListProps {
    pedidos: Pedido[];
    onDelete: (titulo: string) => void;
    onEdit: (titulo: string, novosDados: any) => void;
}

export default function PedidosListSection({ pedidos, onDelete }: PedidosListProps) {
    const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
    const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);

    return (
        <>
            {/* ====================== LISTA DE PEDIDOS ====================== */}
            <FlatList
                data={pedidos}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <CardPedido
                        {...item}
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

                                        {/* Descrição */}
                                        <View className="bg-gray-100 rounded-xl p-4 mb-4 flex-row justify-between items-start">
                                            <Text className="text-gray-700 flex-1 mr-2">
                                                {pedidoSelecionado.descricao || "Sem descrição disponível."}
                                            </Text>

                                            {/* Ícone de edição só se for pendente */}
                                            {pedidoSelecionado.estado === "Pendente" && (
                                                <TouchableOpacity
                                                    onPress={() => console.log("Editar pedido")}
                                                >
                                                    <Feather name="edit-2" size={18} color="#3b82f6" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

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
                                                onDelete(pedidoSelecionado.titulo);
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
