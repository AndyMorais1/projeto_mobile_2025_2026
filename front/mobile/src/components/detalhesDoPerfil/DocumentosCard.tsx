import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

type DocumentosCardProps = {
    total: number;
    onPress?: () => void;
};

export default function DocumentosCard({ total, onPress }: DocumentosCardProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-white border border-gray-200 rounded-2xl p-5 flex-row items-center justify-between mb-16 shadow-sm"
        >
            <View className="flex-row items-center">
                <Feather name="file-text" size={22} color="#3b82f6" />
                <Text className="ml-3 text-gray-800 font-semibold text-base">
                    Documentos
                </Text>
            </View>
            <Text className="text-gray-600 font-bold text-base">{total}</Text>
        </TouchableOpacity>
    );
}
