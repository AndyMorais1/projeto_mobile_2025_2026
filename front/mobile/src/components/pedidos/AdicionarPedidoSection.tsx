import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    TouchableWithoutFeedback,
    ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import  TipoDropdown  from "./TipoDropdown";

interface AdicionarPedidoProps {
    onAdd: (pedido: any) => void;
}

export default function AdicionarPedidoSection({ onAdd }: AdicionarPedidoProps) {
    // ========================== ESTADOS DO MODAL ==========================
    const [modalVisible, setModalVisible] = useState(false);
    const [novoTitulo, setNovoTitulo] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");
    const [tipoPedido, setTipoPedido] = useState("Selecione o Tipo");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const tipos = ["Manutenção", "Reportar Problema", "Outro"];

    // ========================== FUNÇÕES ==========================
    const handleAdicionar = () => {
        if (!novoTitulo.trim()) return;
        const novoPedido = {
            titulo: novoTitulo,
            descricao: novaDescricao,
            tipo: tipoPedido,
            estado: "Pendente",
            data: new Date().toLocaleDateString("pt-PT"),
        };
        onAdd(novoPedido);
        handleFecharModal();
    };

    const handleFecharModal = () => {
        setModalVisible(false);
        setNovoTitulo("");
        setNovaDescricao("");
        setTipoPedido("Selecione o Tipo");
        setDropdownOpen(false);
    };

    // ========================== INTERFACE ==========================
    return (
        <>
            {/* ====================== BOTÃO PRA ADD PEDIDO ====================== */}
            <TouchableOpacity
                className="bg-white rounded-2xl border border-gray-300 flex-row justify-center items-center py-6 mb-8 shadow-sm"
                onPress={() => setModalVisible(true)}
            >
                <Feather name="plus" size={20} color="black" />
                <Text className="ml-2 text-lg font-semibold text-black">
                    Adicionar pedido
                </Text>
            </TouchableOpacity>

            {/* ====================== MODAL DE NOVO PEDIDO ====================== */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={handleFecharModal}
            >
                <TouchableWithoutFeedback onPress={handleFecharModal}>
                    <View className="flex-1 justify-center items-center bg-black/25 px-4">
                        <TouchableWithoutFeedback>
                            <View className="bg-white w-full rounded-2xl p-6 shadow-md">
                                <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                                    <Text className="text-2xl font-bold mb-6 text-blue-500 text-center">
                                        Novo Pedido
                                    </Text>

                                    {/* ========== Dropdown do tipo ========== */}
                                    <TipoDropdown
                                        aberto={dropdownOpen}
                                        valor={tipoPedido}
                                        tipos={tipos}
                                        onToggle={() => setDropdownOpen(!dropdownOpen)}
                                        onSelect={(tipo) => {
                                            setTipoPedido(tipo);
                                            setDropdownOpen(false);
                                        }}
                                    />

                                    {/* ========== Campo Título ========== */}
                                    <View className="mb-5">
                                        <Text className="text-gray-700 font-semibold mb-2">
                                            Título
                                        </Text>
                                        <TextInput
                                            placeholder="Ex.: Solicitar limpeza na rua 20"
                                            placeholderTextColor="#9ca3af"
                                            className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700"
                                            value={novoTitulo}
                                            onChangeText={setNovoTitulo}
                                        />
                                    </View>

                                    {/* ========== Campo Descrição / Mensagem ========== */}
                                    <View className="mb-8">
                                        <Text className="text-gray-700 font-semibold mb-2">
                                            Mensagem
                                        </Text>
                                        <TextInput
                                            placeholder="Dê detalhes do pedido..."
                                            placeholderTextColor="#9ca3af"
                                            multiline
                                            numberOfLines={5}
                                            textAlignVertical="top"
                                            className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700"
                                            value={novaDescricao}
                                            onChangeText={setNovaDescricao}
                                        />
                                    </View>

                                    {/* ========== Botões ========== */}
                                    <View className="flex-row justify-end gap-3">
                                        <TouchableOpacity
                                            className="bg-gray-200 px-5 py-3 rounded-xl"
                                            onPress={handleFecharModal}
                                        >
                                            <Text className="font-semibold text-gray-700">
                                                Cancelar
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            className="bg-blue-500 px-5 py-3 rounded-xl"
                                            onPress={handleAdicionar}
                                        >
                                            <Text className="text-white font-semibold">
                                                Adicionar
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

