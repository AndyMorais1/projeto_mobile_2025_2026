// src/components/home/QuickActions.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface QuickActionsProps {
    valor: number;
    pedidos: number;
}

export default function QuickActions({ valor, pedidos }: QuickActionsProps) {
    const router = useRouter();

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
                {/* Contactar admin */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mr-2"
                >
                    <Feather
                        name="phone"
                        size={20}
                        color="#3b82f6"
                        style={{ marginBottom: 8 }}
                    />
                    <Text className="text-gray-500 text-lg font-medium mb-2">
                        Contactar admin
                    </Text>
                </TouchableOpacity>

                {/* Card invisível para equilibrar o layout */}
                <View className="flex-1 bg-transparent ml-10" />
            </View>
        </View>
    );
}
