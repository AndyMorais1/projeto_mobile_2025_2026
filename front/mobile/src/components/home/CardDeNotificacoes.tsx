import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

type Aviso = {
    titulo: string;
    descricao?: string | null;
    created_at?: string | null;
};

interface CardDeNotificacoesProps {
    aviso: Aviso | null;
}

export default function CardDeNotificacoes({ aviso }: CardDeNotificacoesProps) {
    // nenhum aviso ativo
    if (!aviso) {
        return (
            <View className="p-4 mt-4">
                <Text className="text-xl font-bold mb-4 text-blue-500">Avisos</Text>

                <View className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200">
                    <View className="flex-row items-start mb-2">
                        <Feather
                            name="info"
                            size={20}
                            color="#9ca3af"
                            style={{ marginRight: 8 }}
                        />
                        <Text className="text-base text-gray-500 flex-1">
                            Não há avisos ativos neste momento.
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    // há aviso
    const dataTexto = aviso.created_at
        ? new Date(aviso.created_at).toLocaleDateString("pt-PT")
        : "Hoje";

    return (
        <View className="p-4 mt-4">
            <Text className="text-xl font-bold mb-4 text-blue-500">Avisos</Text>

            <View className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200">
                <View className="flex-row items-start mb-2">
                    <Feather
                        name="mic"
                        size={22}
                        color="#3b82f6"
                        style={{ marginRight: 8 }}
                    />
                    <Text className="text-xl font-bold text-black flex-1">
                        {aviso.titulo}
                    </Text>
                </View>

                {aviso.descricao ? (
                    <Text className="text-gray-700 text-base leading-relaxed">
                        {aviso.descricao}
                    </Text>
                ) : (
                    <Text className="text-gray-500 text-sm">
                        Sem descrição para este aviso.
                    </Text>
                )}

                <Text className="text-gray-500 text-base mt-1">
                    Publicado em {dataTexto}.
                </Text>
            </View>
        </View>
    );
}
