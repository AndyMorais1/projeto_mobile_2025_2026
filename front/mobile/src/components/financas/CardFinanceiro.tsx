import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface CardFinanceiroProps {
    tipo: "pagamento" | "recibo";
    descricao: string;
    valor?: number;
    mes?: string;
    ano?: number;
    data?: string;
    onPagar?: () => void; // para abrir o modal do pagamento
}

export default function CardFinanceiro({ tipo, descricao, valor, mes, ano, data,onPagar}: CardFinanceiroProps) {

    if (tipo === "pagamento") {
        return (
            <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-200 flex-row justify-between items-center">
                <View>
                    <Text className="text-lg font-semibold">
                        {descricao} - {valor}€
                    </Text>
                    <Text className="text-gray-500 text-sm">
                        Mês de {mes}, {ano}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={onPagar}
                    className="bg-blue-500 flex-row items-center px-3 py-2 rounded-xl"
                >
                    <Feather name="credit-card" size={16} color="white" />
                    <Text className="text-white font-semibold ml-2">Pagar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // tipo === "recibo"
    return (
        <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-200 flex-row justify-between items-center">
            <View>
                <Text className="text-gray-400 text-base mb-1">{data}</Text>
                <Text className="text-black text-lg font-semibold">{descricao}</Text>
            </View>
            <Feather name="download" size={22} color="#3b82f6" />
        </View>
    );
}
