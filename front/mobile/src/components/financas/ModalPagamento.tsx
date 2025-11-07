import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";

type Metodo = "cartao" | "mbway" | null;

interface ModalPagamentoProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (metodo: "Cartão" | "MB Way", payload?: Record<string, any>) => void;
    valor?: number;
    descricao?: string;
}

export default function ModalPagamento({
                                           visible,
                                           onClose,
                                           onConfirm,
                                           valor,
                                           descricao,
                                       }: ModalPagamentoProps) {
    const [metodo, setMetodo] = useState<Metodo>(null);
    const [mbwayPhone, setMbwayPhone] = useState("");

    const podeConfirmar =
        metodo === "cartao" || (metodo === "mbway" && mbwayPhone.trim().length >= 9);

    const handleConfirm = () => {
        if (!podeConfirmar) return;
        if (metodo === "cartao") {
            onConfirm("Cartão");
        } else if (metodo === "mbway") {
            onConfirm("MB Way", { phone: mbwayPhone.trim() });
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center items-center bg-black/40 px-4"
                >
                    <View className="bg-white rounded-2xl w-full p-5">
                        {/* Cabeçalho */}
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-blue-600">Pagamento</Text>
                            <TouchableOpacity
                                accessibilityLabel="Fechar"
                                onPress={onClose}
                                className="p-1 rounded-full active:opacity-80"
                            >
                                <Feather name="x" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Resumo */}
                        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                            <Text className="text-gray-500 text-sm">Descrição</Text>
                            <Text className="text-gray-800 font-semibold mb-2">
                                {descricao || "Pagamento de condomínio"}
                            </Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-sm">Valor</Text>
                                <Text className="text-blue-600 font-extrabold text-xl">
                                    {valor != null ? `€ ${valor.toFixed(2)}` : "—"}
                                </Text>
                            </View>
                        </View>

                        {/* Título métodos */}
                        <Text className="text-gray-800 font-semibold mb-3">
                            Escolhe o método de pagamento
                        </Text>

                        {/* Cartões de método */}
                        <View className="flex-row gap-3 mb-2">
                            {/* Cartão */}
                            <TouchableOpacity
                                className={`flex-1 border rounded-2xl p-4 ${
                                    metodo === "cartao" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                                }`}
                                activeOpacity={0.9}
                                onPress={() => setMetodo("cartao")}
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center">
                                        <Feather
                                            name="credit-card"
                                            size={18}
                                            color={metodo === "cartao" ? "#3b82f6" : "#6b7280"}
                                        />
                                        <Text className="ml-2 font-semibold text-gray-800">Cartão</Text>
                                    </View>
                                    {metodo === "cartao" && (
                                        <Feather name="check-circle" size={18} color="#3b82f6" />
                                    )}
                                </View>
                                <Text className="text-gray-500 text-xs">Visa, Mastercard. Seguro e imediato.</Text>
                            </TouchableOpacity>

                            {/* MB Way */}
                            <TouchableOpacity
                                className={`flex-1 border rounded-2xl p-4 ${
                                    metodo === "mbway" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                                }`}
                                activeOpacity={0.9}
                                onPress={() => setMetodo("mbway")}
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center">
                                        <Feather
                                            name="smartphone"
                                            size={18}
                                            color={metodo === "mbway" ? "#3b82f6" : "#6b7280"}
                                        />
                                        <Text className="ml-2 font-semibold text-gray-800">MB Way</Text>
                                    </View>
                                    {metodo === "mbway" && (
                                        <Feather name="check-circle" size={18} color="#3b82f6" />
                                    )}
                                </View>
                                <Text className="text-gray-500 text-xs">Confirma no teu telemóvel.</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Campo extra quando é MB Way */}
                        {metodo === "mbway" && (
                            <View className="mt-3 mb-1">
                                <Text className="text-gray-700 font-medium mb-2">Telemóvel MB Way</Text>
                                <TextInput
                                    keyboardType="phone-pad"
                                    placeholder="9xxxxxxxx"
                                    placeholderTextColor="#9ca3af"
                                    value={mbwayPhone}
                                    onChangeText={setMbwayPhone}
                                    className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-800"
                                />
                                <Text className="text-gray-400 text-xs mt-1">
                                    Iremos enviar a solicitação para este número.
                                </Text>
                            </View>
                        )}

                        {/* Ações */}
                        <View className="flex-row justify-end gap-3 mt-5">
                            <TouchableOpacity
                                onPress={onClose}
                                className="px-4 py-3 rounded-xl bg-gray-100 active:opacity-80"
                            >
                                <Text className="text-gray-700 font-medium">Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleConfirm}
                                disabled={!podeConfirmar}
                                className={`px-5 py-3 rounded-xl ${
                                    podeConfirmar ? "bg-blue-500" : "bg-blue-300"
                                }`}
                            >
                                <Text className="text-white font-semibold">
                                    {metodo === "mbway"
                                        ? "Pagar com MB Way"
                                        : metodo === "cartao"
                                            ? "Pagar com Cartão"
                                            : "Continuar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
