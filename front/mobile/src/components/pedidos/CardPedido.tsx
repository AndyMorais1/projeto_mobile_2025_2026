import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface CardPedidoProps {
    titulo: string;
    estado: string;
    data: string;
    tipo: string;
    onPress: () => void;
    temResposta?: boolean; // novo campo opcional
}

export default function CardPedido({
                                       titulo,
                                       estado,
                                       data,
                                       tipo,
                                       temResposta = false,
                                       onPress,
                                   }: CardPedidoProps) {
    let estadoCor = "text-gray-500";

    switch (estado) {
        case "Pendente":
            estadoCor = "text-amber-600";
            break;
        case "Aprovado":
            estadoCor = "text-blue-600";
            break;
        case "Rejeitado":
            estadoCor = "text-red-500";
            break;
        case "Concluido":
            estadoCor = "text-green-600";
            break;
    }

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-200"
        >
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-lg font-semibold text-black">{titulo}</Text>

                {/* Mostra estrela se houver resposta */}
                {temResposta && (
                    <Feather name="star" size={18} color="#facc15" /> // amarelo, chamativo
                )}
            </View>

            <Text className={`${estadoCor} mb-1 font-semibold`}>
                Estado: {estado}
            </Text>
            <Text className="text-gray-600 mb-1">Data: {data}</Text>
            <Text className="text-gray-600 mb-1">Tipo: {tipo}</Text>
        </TouchableOpacity>
    );
}