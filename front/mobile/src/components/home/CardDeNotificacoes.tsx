import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function CardDeNotificacoes() {
    return (
        <View className="p-4 mt-4">
            <Text className="text-xl font-bold mb-4 text-blue-500">Avisos</Text>

            <View className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200">
                <View className="flex-row items-start mb-2">
                    <Feather name="mic" size={22} color="#3b82f6" style={{ marginRight: 8 }} />
                    <Text className="text-xl font-bold text-black flex-1">
                        Programação de feriados
                    </Text>
                </View>

                <Text className="text-gray-700 text-base leading-relaxed">
                    O escritório de administração estará fechado no dia 1 de janeiro de
                    2026. Contacto de emergência disponível 24/7.
                </Text>

                <Text className="text-gray-500 text-base mt-1">Publicado ontem.</Text>
            </View>
        </View>
    );
}
