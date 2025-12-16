// src/components/home/QuickActions.tsx
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    FlatList,
    Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";

interface ContatoCondominio {
    telefone: string;
    entidade: string;
}

interface QuickActionsProps {
    valor: number;
    pedidos: number;
    contatos?: ContatoCondominio[]; // <- pode vir undefined ou []
}

export default function QuickActions({
                                         valor,
                                         pedidos,
                                         contatos,
                                     }: QuickActionsProps) {
    const router = useRouter();
    const [modalVisible, setModalVisible] = React.useState(false);

    // abrir dialer do telemóvel
    async function ligar(telefone: string) {
        const tel = telefone.trim();
        if (!tel) return;

        const url = `tel:${tel}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        }
    }

    const temContatos = contatos && contatos.length > 0;

    return (
        <View className="px-4 mt-4">
            {/* Título */}
            <Text className="text-xl font-bold mb-4 text-blue-500">Ações rápidas</Text>

            {/* Primeira linha */}
            <View className="flex-row justify-between mb-4">
                {/* Dívida mensal */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("/financas")}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mr-2"
                >
                    <Text className="text-gray-500 text-lg font-medium mb-2">
                        Dívida mensal
                    </Text>
                    <Text className="text-2xl font-bold text-blue-500">
                        {valor.toFixed(2).replace(".", ",")} €
                    </Text>
                </TouchableOpacity>

                {/* pedidos pendentes */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("/pedidos")}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 ml-2"
                >
                    <Text className="text-gray-500 text-lg font-medium mb-2">
                        Pedidos pendentes
                    </Text>
                    <Text className="text-2xl font-medium text-green-500">
                        {pedidos} pedidos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Segunda linha */}
            <View className="flex-row justify-between mb-4">
                {/* Contactar admin / contactos do condomínio */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mr-2"
                    onPress={() => setModalVisible(true)}
                >
                    <Feather
                        name="phone"
                        size={18}
                        color="#3b82f6"

                    />
                    <Text className="text-gray-500 text-lg font-medium mb-2">
                        Contactos
                    </Text>
                    <Text className="text-gray-400 text-sm">

                    </Text>
                </TouchableOpacity>

                {/* Card invisível para equilibrar o layout */}
                <View className="flex-1 bg-transparent ml-10" />
            </View>

            {/* MODAL DE CONTACTOS */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/30 px-6">
                        <TouchableWithoutFeedback>
                            <View className="bg-white w-full rounded-2xl p-5 shadow-lg">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-bold text-blue-500">
                                        Contactos
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                        className="p-1 rounded-full"
                                    >
                                        <Feather name="x" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>

                                {!temContatos ? (
                                    <Text className="text-gray-500 text-sm">
                                        Ainda não existem contactos registados para este condomínio.
                                    </Text>
                                ) : (
                                    <FlatList
                                        data={contatos}
                                        keyExtractor={(_, index) => index.toString()}
                                        ItemSeparatorComponent={() => (
                                            <View className="h-px bg-gray-200 my-2" />
                                        )}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => ligar(item.telefone)}
                                                className="flex-row justify-between items-center py-1"
                                            >
                                                <View className="flex-1 mr-3">
                                                    <Text className="text-base font-semibold text-gray-800">
                                                        {item.entidade}
                                                    </Text>
                                                    <Text className="text-gray-500 text-sm">
                                                        {item.telefone}
                                                    </Text>
                                                </View>
                                                <Feather name="phone-call" size={20} color="#3b82f6" />
                                            </TouchableOpacity>
                                        )}
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
