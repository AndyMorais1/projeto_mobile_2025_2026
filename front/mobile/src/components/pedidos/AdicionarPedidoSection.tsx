import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    TouchableWithoutFeedback,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import TipoDropdown from "./TipoDropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/api/client";

interface AdicionarPedidoProps {
    onAdd: () => void;
}

export default function AdicionarPedidoSection({ onAdd }: AdicionarPedidoProps) {
    // ========================== ESTADOS ==========================
    const [modalVisible, setModalVisible] = useState(false);

    const [novoTitulo, setNovoTitulo] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");

    const [tipoPedido, setTipoPedido] =
        useState<{ label: string; value: string } | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [categoria, setCategoria] =
        useState<{ label: string; value: string } | null>(null);
    const [categoriaOpen, setCategoriaOpen] = useState(false);

    const [urgencia, setUrgencia] =
        useState<{ label: string; value: string } | null>(null);
    const [urgenciaOpen, setUrgenciaOpen] = useState(false);

    const [orcamento, setOrcamento] = useState("");

    const [dataPrevista, setDataPrevista] = useState<Date | null>(null);
    const [horaPrevista, setHoraPrevista] = useState<Date | null>(null);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // ========================== LISTAS ==========================

    const tipos = [
        { label: "Manutenção", value: "manutenção" },
        { label: "Reportar Problema", value: "reportar" },
        { label: "Outro", value: "outro" },
    ];

    const categorias = [
        { label: "Canalização", value: "canalizador" },
        { label: "Eletricista", value: "eletricista" },
        { label: "Limpeza", value: "limpeza" },
        { label: "Jardinagem", value: "jardinagem" },
        { label: "Outro", value: "outro" },
    ];

    const urgencias = [
        { label: "Baixa", value: "baixa" },
        { label: "Média", value: "media" },
        { label: "Alta", value: "alta" },
    ];

    // ========================== FUNÇÕES ==========================

    function resetarCampos() {
        setNovoTitulo("");
        setNovaDescricao("");
        setTipoPedido(null);
        setCategoria(null);
        setUrgencia(null);
        setDropdownOpen(false);
        setCategoriaOpen(false);
        setUrgenciaOpen(false);
        setOrcamento("");
        setDataPrevista(null);
        setHoraPrevista(null);
    }

    const formatarData = (date: Date) =>
        date.toLocaleDateString("pt-PT");

    const formatarHora = (date: Date) =>
        date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

    async function handleAdicionar() {
        if (!novoTitulo.trim() || !tipoPedido?.value) {
            alert("Preencha o título e tipo do pedido.");
            return;
        }

        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;

        if (!user) {
            alert("Erro: sessão inválida.");
            return;
        }

        if (tipoPedido.value === "manutenção") {
            if (!categoria || !urgencia || !orcamento || !dataPrevista || !horaPrevista) {
                alert("Preencha todos os campos de Manutenção.");
                return;
            }
        }

        const payload = {
            titulo: novoTitulo.trim(),
            descricao: novaDescricao.trim(),

            tipo_pedido: tipoPedido.value,
            estado_pedido: "pendente",
            morador_id: user.id,

            categoria: tipoPedido.value === "manutenção" ? categoria?.value : null,
            urgencia: tipoPedido.value === "manutenção" ? urgencia?.value : null,
            orcamento_max:
                tipoPedido.value === "manutenção" ? Number(orcamento) : null,

            data_prevista:
                tipoPedido.value === "manutenção"
                    ? dataPrevista?.toISOString().split("T")[0]
                    : null,
            hora_prevista:
                tipoPedido.value === "manutenção"
                    ? `${horaPrevista?.getHours().toString().padStart(2, "0")}:${horaPrevista
                        ?.getMinutes()
                        .toString()
                        .padStart(2, "0")}`
                    : null,
        };

        const { error } = await supabase.from("pedido").insert(payload);

        if (error) {
            console.log(error);
            alert("Erro ao enviar pedido.");
            return;
        }

        onAdd();
        handleFecharModal();
    }

    const handleFecharModal = () => {
        setModalVisible(false);
        resetarCampos();
    };

    // ========================== INTERFACE ==========================
    return (
        <>
            {/* BOTÃO PARA ABRIR MODAL */}
            <TouchableOpacity
                className="bg-white rounded-2xl border border-gray-300 flex-row justify-center items-center py-6 mb-8 shadow-sm"
                onPress={() => setModalVisible(true)}
            >
                <Feather name="plus" size={20} color="black" />
                <Text className="ml-2 text-lg font-semibold text-black">
                    Adicionar pedido
                </Text>
            </TouchableOpacity>

            {/* MODAL */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={handleFecharModal}
            >
                <TouchableWithoutFeedback onPress={handleFecharModal}>
                    <View className="flex-1 justify-center items-center bg-black/25 px-4">
                        <TouchableWithoutFeedback>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                style={{ width: "100%" }}
                            >
                                <View className="bg-white w-full rounded-2xl p-6 shadow-md">
                                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                                        <Text className="text-2xl font-bold mb-6 text-blue-500 text-center">
                                            Novo Pedido
                                        </Text>

                                        {/* TIPO */}
                                        <TipoDropdown
                                            aberto={dropdownOpen}
                                            valor={tipoPedido?.label || "Selecione o Tipo"}
                                            tipos={tipos}
                                            onToggle={() => setDropdownOpen(!dropdownOpen)}
                                            onSelect={(item) => {
                                                setTipoPedido(item);
                                                setDropdownOpen(false);
                                            }}
                                        />

                                        {/* CAMPOS COMUNS */}
                                        <View className="mb-5">
                                            <Text className="text-gray-700 font-semibold mb-2">
                                                Título
                                            </Text>
                                            <TextInput
                                                placeholder="Ex.: Substituição de lâmpada"
                                                placeholderTextColor="#9ca3af"
                                                className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700"
                                                value={novoTitulo}
                                                onChangeText={setNovoTitulo}
                                            />
                                        </View>

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

                                        {/* CAMPOS DE MANUTENÇÃO */}
                                        {tipoPedido?.value === "manutenção" && (
                                            <>
                                                {/* Categoria */}
                                                <TipoDropdown
                                                    aberto={categoriaOpen}
                                                    valor={
                                                        categoria?.label ||
                                                        "Selecione a Categoria"
                                                    }
                                                    tipos={categorias}
                                                    onToggle={() =>
                                                        setCategoriaOpen(!categoriaOpen)
                                                    }
                                                    onSelect={(item) => {
                                                        setCategoria(item);
                                                        setCategoriaOpen(false);
                                                    }}
                                                />

                                                {/* Urgência */}
                                                <TipoDropdown
                                                    aberto={urgenciaOpen}
                                                    valor={
                                                        urgencia?.label ||
                                                        "Selecione a Urgência"
                                                    }
                                                    tipos={urgencias}
                                                    onToggle={() =>
                                                        setUrgenciaOpen(!urgenciaOpen)
                                                    }
                                                    onSelect={(item) => {
                                                        setUrgencia(item);
                                                        setUrgenciaOpen(false);
                                                    }}
                                                />

                                                {/* Orçamento */}
                                                <View className="mb-6">
                                                    <Text className="text-gray-700 font-semibold mb-2">
                                                        Orçamento Máximo (€)
                                                    </Text>
                                                    <TextInput
                                                        placeholder="Ex.: 150"
                                                        keyboardType="numeric"
                                                        value={orcamento}
                                                        onChangeText={setOrcamento}
                                                        className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700"
                                                    />
                                                </View>

                                                {/* Data prevista */}
                                                <TouchableOpacity
                                                    className="mb-6 border border-gray-300 rounded-xl px-4 py-3 bg-gray-50"
                                                    onPress={() => setShowDatePicker(true)}
                                                >
                                                    <Text className="text-gray-700 font-semibold mb-2">
                                                        Data Prevista
                                                    </Text>
                                                    <Text className="text-gray-700">
                                                        {dataPrevista
                                                            ? formatarData(dataPrevista)
                                                            : "Selecione uma data"}
                                                    </Text>
                                                </TouchableOpacity>

                                                {showDatePicker && (
                                                    <DateTimePicker
                                                        value={dataPrevista || new Date()}
                                                        mode="date"
                                                        display="default"
                                                        onChange={(e, d) => {
                                                            setShowDatePicker(false);
                                                            if (d) setDataPrevista(d);
                                                        }}
                                                    />
                                                )}

                                                {/* Hora prevista */}
                                                <TouchableOpacity
                                                    className="mb-6 border border-gray-300 rounded-xl px-4 py-3 bg-gray-50"
                                                    onPress={() => setShowTimePicker(true)}
                                                >
                                                    <Text className="text-gray-700 font-semibold mb-2">
                                                        Hora Prevista
                                                    </Text>
                                                    <Text className="text-gray-700">
                                                        {horaPrevista
                                                            ? formatarHora(horaPrevista)
                                                            : "Selecione uma hora"}
                                                    </Text>
                                                </TouchableOpacity>

                                                {showTimePicker && (
                                                    <DateTimePicker
                                                        value={horaPrevista || new Date()}
                                                        mode="time"
                                                        display="default"
                                                        onChange={(e, d) => {
                                                            setShowTimePicker(false);
                                                            if (d) setHoraPrevista(d);
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Botões */}
                                        <View className="flex-row justify-end gap-3 mt-4">
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
                            </KeyboardAvoidingView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}
